type FooterLink = { label: string; href: string };

type FooterSection = {
  title: string;
  href?: string;
  links?: FooterLink[];
};

type FooterColumn = {
  sections: FooterSection[];
};

const FOOTER_COLUMNS: FooterColumn[] = [
  {
    sections: [
      {
        title: "About us",
        href: "https://www.ottogroup.com/en/ueber-uns/",
        links: [
          { label: "Values", href: "https://www.ottogroup.com/en/ueber-uns/werte.php" },
          { label: "Management", href: "https://www.ottogroup.com/en/ueber-uns/management.php" },
          { label: "Key figures", href: "https://www.ottogroup.com/en/ueber-uns/kennzahlen.php" },
          { label: "Group companies", href: "https://www.ottogroup.com/en/ueber-uns/konzernfirmen.php" },
          { label: "Creditor Relations", href: "https://www.ottogroup.com/en/ueber-uns/creditor-relations.php" },
          { label: "History and founder", href: "https://www.ottogroup.com/en/ueber-uns/historie-und-gruender.php" },
          { label: "Memberships and alliances", href: "https://www.ottogroup.com/en/ueber-uns/mitgliedschaften-und-allianzen.php" },
          { label: "Compliance", href: "https://www.ottogroup.com/en/ueber-uns/compliance.php" }
        ]
      }
    ]
  },
  {
    sections: [
      {
        title: "Strategy",
        href: "https://www.ottogroup.com/en/strategie/"
      }
    ]
  },
  {
    sections: [
      {
        title: "Sustainability",
        href: "https://www.ottogroup.com/en/nachhaltigkeit/",
        links: [
          { label: "Environmental responsibility", href: "https://www.ottogroup.com/en/nachhaltigkeit/oekologische-verantwortung.php" },
          { label: "Social responsibility", href: "https://www.ottogroup.com/en/nachhaltigkeit/gesellschaftliche-verantwortung.php" },
          { label: "Digital responsibility", href: "https://www.ottogroup.com/en/nachhaltigkeit/corporate-digital-responsibility.php" },
          { label: "Supply Chain", href: "https://www.ottogroup.com/en/nachhaltigkeit/lieferkette.php" },
          { label: "Reports and Policies", href: "https://www.ottogroup.com/en/nachhaltigkeit/berichte-richtlinien.php" }
        ]
      }
    ]
  },
  {
    sections: [
      {
        title: "Careers",
        href: "https://www.ottogroup.com/en/careers/",
        links: [
          { label: "Working at the Otto Group", href: "https://www.ottogroup.com/en/careers/" },
          { label: "Job portal", href: "https://www.ottogroup.com/en/careers/jobs/" }
        ]
      },
      {
        title: "Stories",
        href: "https://www.ottogroup.com/en/stories/"
      },
      {
        title: "Media",
        href: "https://www.ottogroup.com/en/medien/",
        links: [
          { label: "Newsroom", href: "https://www.ottogroup.com/en/medien/newsroom/" },
          { label: "Downloads", href: "https://www.ottogroup.com/en/medien/downloads/" },
          { label: "Press contacts", href: "https://www.ottogroup.com/en/medien/kontakte/" }
        ]
      }
    ]
  }
];

const SOCIAL_LINKS = [
  { label: "LinkedIn", href: "https://www.linkedin.com/company/ottogroup", icon: "linkedin" },
  { label: "Instagram", href: "https://instagram.com/ottogroupcom/", icon: "instagram" },
  { label: "YouTube", href: "https://www.youtube.com/channel/UCUAIZw9OFAiFNSVuUCI8DoA", icon: "youtube" },
  { label: "SoundCloud", href: "https://soundcloud.com/ottogroup", icon: "soundcloud" },
  { label: "X", href: "https://twitter.com/ottogroup_com?lang=de", icon: "x" },
  { label: "Facebook", href: "https://www.facebook.com/ottogroupcom/", icon: "facebook" }
] as const;

function FooterHeading({ title, href }: { title: string; href?: string }) {
  if (href) {
    return (
      <h4 className="otto-footer-heading">
        <a href={href} target="_blank" rel="noopener noreferrer">
          {title}
        </a>
      </h4>
    );
  }
  return <h4 className="otto-footer-heading">{title}</h4>;
}

function SocialIcon({ icon }: { icon: (typeof SOCIAL_LINKS)[number]["icon"] }) {
  return <span className={`otto-social-sprite otto-social-sprite--${icon}`} aria-hidden="true" />;
}

export default function OttoFooter() {
  return (
    <footer className="otto-footer">
      <div className="otto-footer-rule" />
      <div className="otto-footer-inner">
        <div className="otto-footer-nav">
          {FOOTER_COLUMNS.map((column, index) => (
            <div key={index} className="otto-footer-col">
              {column.sections.map((section) => (
                <div key={section.title} className="otto-footer-section">
                  <FooterHeading title={section.title} href={section.href} />
                  {section.links && section.links.length > 0 && (
                    <ul className="otto-footer-links">
                      {section.links.map((link) => (
                        <li key={link.label}>
                          <a href={link.href} target="_blank" rel="noopener noreferrer">
                            {link.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="otto-footer-meta">
          <div className="otto-footer-meta-left">
            <div className="otto-footer-social">
              {SOCIAL_LINKS.map((item) => (
                <a
                  key={item.label}
                  className="otto-social-btn"
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Otto Group on ${item.label}`}
                  title={`Otto Group on ${item.label}`}
                >
                  <SocialIcon icon={item.icon} />
                </a>
              ))}
            </div>
            <p className="otto-footer-copy">© {new Date().getFullYear()} Otto Group</p>
          </div>

          <nav className="otto-footer-legal" aria-label="Legal">
            <a href="https://www.ottogroup.com/en/impressum/" target="_blank" rel="noopener noreferrer">
              Imprint
            </a>
            <a href="https://www.ottogroup.com/en/datenschutz/" target="_blank" rel="noopener noreferrer">
              Data protection
            </a>
            <a href="https://www.ottogroup.com/en/datenschutz/" target="_blank" rel="noopener noreferrer">
              Cookie settings
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
