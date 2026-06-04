// Vercel Serverless Function — Proxy para registrar vendas na Utmify
// Endpoint: POST /api/utmify-webhook

export default async function handler(req, res) {
  // Permite CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const UTMIFY_API_TOKEN = process.env.UTMIFY_API_TOKEN || 'qWR5tZDJ2xyQ7h6VZyAPqYZD68ipekums4Hl';

  try {
    const body = req.body;
    const priceInCents = body.priceInCents || Math.round((body.price || 69.95) * 100);

    // Monta o payload no formato EXATO exigido pela API da Utmify
    const utmifyPayload = {
      orderId: body.orderId || ('TD' + Date.now()),
      platform: 'other',
      paymentMethod: body.paymentMethod || 'credit_card',
      status: 'paid',
      isTest: body.isTest || false,
      customer: {
        name: body.customerName || 'Customer',
        email: body.customerEmail || '',
        phone: body.customerPhone || '',
        document: body.customerDocument || ''
      },
      products: [
        {
          id: body.productId || 'dewalt-brushless-twin-kit',
          name: body.productName || 'DeWalt Brushless Twin Kit',
          planId: body.planId || 'plan-dewalt-kit',
          planName: body.planName || 'DeWalt Brushless Twin Kit',
          quantity: body.quantity || 1,
          priceInCents: priceInCents
        }
      ],
      commission: {
        totalPriceInCents: priceInCents,
        gatewayFeeInCents: 0,
        userCommissionInCents: priceInCents
      },
      payment: {
        method: body.paymentMethod || 'credit_card',
        installments: body.installments || 1,
        currencyCode: body.currency || 'GBP'
      },
      trackingParameters: {
        src: body.src || '',
        sck: body.sck || '',
        utm_source: body.utm_source || '',
        utm_medium: body.utm_medium || '',
        utm_campaign: body.utm_campaign || '',
        utm_content: body.utm_content || '',
        utm_term: body.utm_term || ''
      },
      createdAt: body.createdAt || new Date().toISOString(),
      approvedDate: body.approvedDate || new Date().toISOString()
    };

    console.log('[Utmify Webhook] Sending payload:', JSON.stringify(utmifyPayload));

    const response = await fetch('https://api.utmify.com.br/api-credentials/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-token': UTMIFY_API_TOKEN
      },
      body: JSON.stringify(utmifyPayload)
    });

    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
    }

    console.log('[Utmify Webhook] Response status:', response.status);
    console.log('[Utmify Webhook] Response body:', responseText);

    if (response.ok) {
      return res.status(200).json({
        success: true,
        message: 'Sale registered on Utmify!',
        utmifyResponse: responseData
      });
    } else {
      return res.status(response.status).json({
        success: false,
        message: 'Utmify API error',
        status: response.status,
        utmifyResponse: responseData
      });
    }

  } catch (error) {
    console.error('[Utmify Webhook] Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}
