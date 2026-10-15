import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { PRIMARY_DOMAIN } from "@/siteSeo";

interface SeoHeadProps {
  title?: string;
  description?: string;
  canonical?: string;
  noIndex?: boolean;
}

export const SeoHead: React.FC<SeoHeadProps> = ({
  title,
  description,
  canonical,
  noIndex = false,
}) => {
  const location = useLocation();

  useEffect(() => {
    if (title) {
      document.title = title;
    }

    if (description) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement("meta");
        metaDesc.setAttribute("name", "description");
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute("content", description);
    }

    // Robots directive
    let metaRobots = document.querySelector('meta[name="robots"]');
    if (!metaRobots) {
      metaRobots = document.createElement("meta");
      metaRobots.setAttribute("name", "robots");
      document.head.appendChild(metaRobots);
    }
    metaRobots.setAttribute(
      "content",
      noIndex ? "noindex, nofollow" : "index, follow"
    );

    // Canonical link
    const cleanPath = location.pathname === "/" ? "" : location.pathname;
    const targetCanonical = canonical || `${PRIMARY_DOMAIN}${cleanPath}`;
    let linkCanonical = document.querySelector('link[rel="canonical"]');
    if (!linkCanonical) {
      linkCanonical = document.createElement("link");
      linkCanonical.setAttribute("rel", "canonical");
      document.head.appendChild(linkCanonical);
    }
    linkCanonical.setAttribute("href", targetCanonical);

    // OpenGraph URL
    let ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) {
      ogUrl.setAttribute("content", targetCanonical);
    }
  }, [title, description, canonical, noIndex, location.pathname]);

  return null;
};

export default SeoHead;
