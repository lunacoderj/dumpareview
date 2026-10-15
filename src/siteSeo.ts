export const PRIMARY_DOMAIN = "https://www.dumpareview.online";

export const siteSeo = {
  primaryDomain: PRIMARY_DOMAIN,
  siteName: "DumpaReview",
  defaultTitle: "DumpaReview - Smart Google Reviews QR Code Generator for Businesses",
  defaultDescription:
    "Turn every customer into 5-star Google reviews. DumpaReview provides smart dynamic QR codes with rotating pre-written review templates for restaurants, salons, clinics, and local businesses.",
  canonicalUrl: (path: string = "") => {
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${PRIMARY_DOMAIN}${cleanPath === "/" ? "" : cleanPath}`;
  },
};
