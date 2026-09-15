export type LmsTenant = "otto" | "vectra";

export type LmsBranding = {
  tenant: LmsTenant;
  productName: string;
  clientName: string;
  vendorName: string;
  vendorUrl: string;
  description: string;
  mailFromName: string;
};

function tenantFromEnv(): LmsTenant {
  const value = (process.env.LMS_TENANT || "otto").trim().toLowerCase();
  return value === "vectra" ? "vectra" : "otto";
}

export function getBranding(): LmsBranding {
  const tenant = tenantFromEnv();
  const vendorName = process.env.LMS_VENDOR_NAME || "VECTRA";
  const vendorUrl = process.env.LMS_VENDOR_URL || "https://vectra-intl.com/";

  if (tenant === "vectra") {
    const productName = process.env.LMS_PRODUCT_NAME || "VECTRA Academy";
    return {
      tenant,
      productName,
      clientName: process.env.LMS_CLIENT_NAME || "VECTRA International",
      vendorName,
      vendorUrl,
      description: process.env.LMS_DESCRIPTION || "VECTRA International learning management system",
      mailFromName: process.env.LMS_MAIL_FROM_NAME || productName
    };
  }

  const productName = process.env.LMS_PRODUCT_NAME || "Otto Group Academy";
  return {
    tenant,
    productName,
    clientName: process.env.LMS_CLIENT_NAME || "Otto Group",
    vendorName,
    vendorUrl,
    description: process.env.LMS_DESCRIPTION || "VECTRA International learning management system",
    mailFromName: process.env.LMS_MAIL_FROM_NAME || productName
  };
}

export function poweredByLabel(branding = getBranding()): string {
  return `e-Learning management system powered by ${branding.vendorName}`;
}
