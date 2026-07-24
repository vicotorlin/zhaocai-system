/**
 * 招采管理系统 - 阿里云短信客户端
 */

const Core = require("@alicloud/pop-core");

let smsClient = null;
let smsAvailable = false;

function initSMS() {
  const accessKeyId = process.env.SMS_ACCESS_KEY_ID || "";
  const accessKeySecret = process.env.SMS_ACCESS_KEY_SECRET || "";
  const signName = process.env.SMS_SIGN_NAME || "招采系统";
  const templateCode = process.env.SMS_TEMPLATE_CODE || "";

  if (accessKeyId && accessKeySecret && accessKeyId !== "your_access_key_id" && templateCode) {
    try {
      smsClient = new Core({
        accessKeyId,
        accessKeySecret,
        endpoint: "https://dysmsapi.aliyuncs.com",
        apiVersion: "2017-05-25",
      });
      smsAvailable = true;
      console.log("[SMS] 阿里云短信已配置, 签名: " + signName);
      return true;
    } catch (e) {
      console.warn("[SMS] 初始化失败:", e.message);
    }
  }
  console.log("[SMS] 未配置 (请设置 SMS_ACCESS_KEY_ID / SMS_ACCESS_KEY_SECRET / SMS_TEMPLATE_CODE)");
  return false;
}

async function sendSMS(phoneNumber, code) {
  if (!smsAvailable) return { success: false, message: "短信服务未配置" };

  const signName = process.env.SMS_SIGN_NAME || "招采系统";
  const templateCode = process.env.SMS_TEMPLATE_CODE || "";

  try {
    const params = {
      PhoneNumbers: phoneNumber,
      SignName: signName,
      TemplateCode: templateCode,
      TemplateParam: JSON.stringify({ code }),
    };

    const result = await smsClient.request("SendSms", params, { method: "POST" });
    if (result.Code === "OK") {
      console.log("[SMS] 已发送至 " + phoneNumber);
      return { success: true, message: "验证码已发送" };
    } else {
      console.error("[SMS] 发送失败:", result.Code, result.Message);
      return { success: false, message: "短信发送失败: " + result.Message };
    }
  } catch (e) {
    console.error("[SMS] 异常:", e.message);
    return { success: false, message: "短信发送异常" };
  }
}

function isAvailable() {
  return smsAvailable;
}

module.exports = { initSMS, sendSMS, isAvailable };
