# Neel Upadhyay — Portfolio

A responsive, dependency-free, multi-page portfolio for Neel Upadhyay, a final-year Software Engineering student focused on backend systems, AWS cloud, and cybersecurity.

![Portfolio social card](assets/images/og-portfolio.png)

## Highlights

- Projects include [Deximon](https://deximon.ca/), an active-development team platform for Pokémon TCG collectors with on-demand AWS EC2 demo hosting, alongside Spring Boot microservices, edge-to-cloud ANPR, applied cryptography, SIEM detection, and FPGA security
- Current Blue Team Level 1, CompTIA Security+, and AWS Certified Cloud Practitioner credentials
- Grouped language, framework, cloud, data, and security stack
- Two primary résumé choices for Software Engineering and Cybersecurity, plus four specialized versions
- Dedicated Projects, Experience, Credentials, Skills, and Contact pages instead of one long scrolling document
- Mobile-first navigation, reduced-motion support, keyboard focus states, semantic metadata, and connected profile/project structured data
- No production framework or runtime dependency

## Run locally

```powershell
npm.cmd start
```

Then open [http://localhost:3000](http://localhost:3000).

Run the dependency-free syntax, link, asset, metadata, and accessibility checks with:

```powershell
npm.cmd test
```

## Project structure

```text
.
├── assets/
│   ├── images/          # Portrait, project proof, and generated brand artwork
│   ├── resume/          # Role-specific PDF résumés
│   └── video/           # Short project demos
├── index.html           # Home page and structured metadata
├── work.html            # Projects and technical labs
├── experience.html      # Experience, education, and résumés
├── credentials.html     # Verified certifications
├── skills.html          # Technical stack and working principles
├── contact.html         # Contact and profile links
├── styles.css           # Shared responsive visual system
├── script.js            # Mobile navigation and subtle reveals
├── validate.js          # Static site integrity checks
├── server.js            # Small local static server
└── CNAME                # GitHub Pages custom domain
```

## Live site

[neelupadhyay.ca](https://neelupadhyay.ca/)

After a significant release, follow the [search setup checklist](SEO_SETUP.md)
to submit the sitemap and request indexing.
