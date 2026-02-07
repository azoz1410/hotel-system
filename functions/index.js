const functions = require('firebase-functions');
const admin = require('firebase-admin');
const twilio = require('twilio');
const cors = require('cors')({ origin: true });

admin.initializeApp();

/**
 * Cloud Function لإرسال رسائل WhatsApp/SMS عبر Twilio
 * 
 * استدعاء:
 * POST https://REGION-PROJECT_ID.cloudfunctions.net/sendWhatsApp
 * 
 * Body:
 * {
 *   "to": "+966501234567",
 *   "message": "كود التحقق: 123456",
 *   "accountSid": "AC...",
 *   "authToken": "...",
 *   "from": "+1234567890",
 *   "tenantId": "hotel-1"
 * }
 */
exports.sendWhatsApp = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    // السماح فقط بطلبات POST
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      const { to, message, accountSid, authToken, from, tenantId } = req.body;

      // التحقق من البيانات المطلوبة
      if (!to || !message || !accountSid || !authToken || !from) {
        return res.status(400).json({ 
          error: 'Missing required fields',
          required: ['to', 'message', 'accountSid', 'authToken', 'from']
        });
      }

      // التحقق من صيغة رقم الهاتف
      if (!to.startsWith('+')) {
        return res.status(400).json({ 
          error: 'Phone number must be in international format (e.g., +966501234567)'
        });
      }

      // إنشاء عميل Twilio
      const client = twilio(accountSid, authToken);

      // إرسال الرسالة
      const twilioMessage = await client.messages.create({
        body: message,
        from: from,
        to: to
      });

      // حفظ سجل في Firebase
      if (tenantId) {
        await admin.database().ref(`tenants/${tenantId}/sms-logs`).push({
          to: to,
          message: message,
          status: twilioMessage.status,
          sid: twilioMessage.sid,
          timestamp: new Date().toISOString(),
          type: 'whatsapp_test'
        });
      }

      // الرد بنجاح
      return res.status(200).json({
        success: true,
        message: 'Message sent successfully',
        sid: twilioMessage.sid,
        status: twilioMessage.status
      });

    } catch (error) {
      console.error('Error sending WhatsApp:', error);
      
      // معالجة أخطاء Twilio المحددة
      if (error.code === 21211) {
        return res.status(400).json({ 
          error: 'Invalid phone number format',
          details: error.message 
        });
      }
      
      if (error.code === 20003) {
        return res.status(401).json({ 
          error: 'Authentication failed - check your Account SID and Auth Token',
          details: error.message 
        });
      }

      return res.status(500).json({ 
        error: 'Failed to send message',
        details: error.message 
      });
    }
  });
});

/**
 * Cloud Function للتحقق من صحة إعدادات Twilio
 */
exports.verifyTwilioCredentials = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      const { accountSid, authToken } = req.body;

      if (!accountSid || !authToken) {
        return res.status(400).json({ error: 'Missing credentials' });
      }

      const client = twilio(accountSid, authToken);
      
      // محاولة الحصول على معلومات الحساب للتحقق
      const account = await client.api.accounts(accountSid).fetch();

      return res.status(200).json({
        success: true,
        valid: true,
        accountName: account.friendlyName,
        status: account.status
      });

    } catch (error) {
      console.error('Verification error:', error);
      return res.status(401).json({
        success: false,
        valid: false,
        error: 'Invalid credentials',
        details: error.message
      });
    }
  });
});

/**
 * Cloud Function لحفظ كود التحقق
 */
exports.saveVerificationCode = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      const { tenantId, identifier, code, type } = req.body;

      if (!tenantId || !identifier || !code || !type) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

      const verificationData = {
        code: code,
        type: type,
        identifier: identifier,
        expiresAt: expiresAt,
        createdAt: new Date().toISOString(),
        verified: false,
        attempts: 0
      };

      const ref = await admin.database()
        .ref(`tenants/${tenantId}/verifications`)
        .push(verificationData);

      return res.status(200).json({
        success: true,
        verificationId: ref.key
      });

    } catch (error) {
      console.error('Error saving verification code:', error);
      return res.status(500).json({
        error: 'Failed to save verification code',
        details: error.message
      });
    }
  });
});

/**
 * Cloud Function للتحقق من الكود المدخل
 */
exports.verifyCode = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      const { tenantId, identifier, code } = req.body;

      if (!tenantId || !identifier || !code) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // البحث عن الكود
      const snapshot = await admin.database()
        .ref(`tenants/${tenantId}/verifications`)
        .orderByChild('identifier')
        .equalTo(identifier)
        .limitToLast(1)
        .once('value');

      if (!snapshot.exists()) {
        return res.status(404).json({
          success: false,
          message: 'Verification code not found'
        });
      }

      const verifications = snapshot.val();
      const verificationKey = Object.keys(verifications)[0];
      const verification = verifications[verificationKey];

      // التحقق من انتهاء الصلاحية
      if (new Date(verification.expiresAt) < new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Verification code expired'
        });
      }

      // التحقق من عدد المحاولات
      if (verification.attempts >= 3) {
        return res.status(400).json({
          success: false,
          message: 'Maximum attempts exceeded'
        });
      }

      // التحقق من الكود
      if (verification.code === code) {
        await admin.database()
          .ref(`tenants/${tenantId}/verifications/${verificationKey}`)
          .update({
            verified: true,
            verifiedAt: new Date().toISOString()
          });

        return res.status(200).json({
          success: true,
          message: 'Verification successful'
        });
      } else {
        await admin.database()
          .ref(`tenants/${tenantId}/verifications/${verificationKey}`)
          .update({
            attempts: verification.attempts + 1
          });

        return res.status(400).json({
          success: false,
          message: 'Invalid code',
          attemptsLeft: 2 - verification.attempts
        });
      }

    } catch (error) {
      console.error('Error verifying code:', error);
      return res.status(500).json({
        error: 'Failed to verify code',
        details: error.message
      });
    }
  });
});
