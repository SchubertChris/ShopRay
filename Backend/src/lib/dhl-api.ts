export interface DhlShipmentRequest {
  recipientName:   string;
  recipientStreet: string;
  recipientZip:    string;
  recipientCity:   string;
  recipientCountry: string;
  weightGrams:     number;
  refNo:           string; // z.B. Bestellnummer
  shipmentDate?:   string; // YYYY-MM-DD, default: heute
}

export interface DhlShipmentResult {
  trackingNumber: string;
  labelB64:       string;
}

function countryCodeToDe(raw: string | undefined): string {
  const map: Record<string, string> = {
    deutschland: 'DEU', germany: 'DEU', de: 'DEU',
    österreich: 'AUT', austria: 'AUT', at: 'AUT', oesterreich: 'AUT',
    schweiz: 'CHE', switzerland: 'CHE', ch: 'CHE',
  };
  return map[(raw ?? '').toLowerCase()] ?? 'DEU';
}

export async function createDhlShipment(req: DhlShipmentRequest): Promise<DhlShipmentResult> {
  const sandbox   = process.env.DHL_SANDBOX === 'true';
  const baseUrl   = sandbox
    ? 'https://api-eu.dhl.com/parcel/de/shipping/v2'
    : 'https://api.dhl.com/parcel/de/shipping/v2';

  const apiKey    = process.env.DHL_API_KEY ?? '';
  const billingNo = process.env.DHL_BILLING_NUMBER ?? '';

  const shipperName   = process.env.DHL_SHIPPER_NAME   ?? '';
  const shipperStreet = process.env.DHL_SHIPPER_STREET ?? '';
  const shipperZip    = process.env.DHL_SHIPPER_ZIP    ?? '';
  const shipperCity   = process.env.DHL_SHIPPER_CITY   ?? '';

  const today = req.shipmentDate ?? new Date().toISOString().split('T')[0];

  const body = {
    profile:   'STANDARD_GRUPPENPROFIL',
    shipments: [{
      product:       'V01PAK',
      billingNumber: billingNo,
      shipper: {
        name1:         shipperName,
        addressStreet: shipperStreet,
        postalCode:    shipperZip,
        city:          shipperCity,
        country:       'DEU',
      },
      consignee: {
        name1:         req.recipientName,
        addressStreet: req.recipientStreet,
        postalCode:    req.recipientZip,
        city:          req.recipientCity,
        country:       countryCodeToDe(req.recipientCountry),
      },
      details: {
        weight: { uom: 'g', value: req.weightGrams },
      },
      shipmentDate: today,
      refNo:        req.refNo,
    }],
  };

  const res = await fetch(`${baseUrl}/shipments`, {
    method:  'POST',
    headers: {
      'dhl-api-key': apiKey,
      'Content-Type': 'application/json',
      'Accept':       'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? `DHL API Fehler ${res.status}`);
  }

  const data = await res.json() as {
    items?: Array<{
      shipmentTrackingNumber?: string;
      label?: { b64?: string };
    }>;
  };

  const item = data.items?.[0];
  if (!item?.shipmentTrackingNumber || !item?.label?.b64) {
    throw new Error('DHL API: Kein Label in der Antwort');
  }

  return {
    trackingNumber: item.shipmentTrackingNumber,
    labelB64:       item.label.b64,
  };
}
