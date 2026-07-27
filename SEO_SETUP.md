# Search setup for neelupadhyay.ca

The site now includes a canonical URL, crawl directives, a root sitemap with
image entries, and connected `WebSite`, `ProfilePage`, `Person`, and project
structured data. Search engines still need time and external identity signals
before a new custom domain can rank consistently.

## Google Search Console

1. Open [Google Search Console](https://search.google.com/search-console/).
2. Add a **Domain property** for `neelupadhyay.ca`.
3. Copy Google's DNS TXT verification record into the domain's DNS settings,
   then complete verification.
4. Open **Sitemaps** and submit:
   `https://neelupadhyay.ca/sitemap.xml`
5. Open **URL inspection**, inspect `https://neelupadhyay.ca/`, choose
   **Test live URL**, and then **Request indexing**.
6. Monitor **Page indexing**, **Core Web Vitals**, and **Performance** for
   indexing issues and the real search queries that reach the site.

Do not repeatedly request indexing. Submit once after a meaningful update and
let Google recrawl the sitemap.

## Connect Neel's identity across the web

- Add `https://neelupadhyay.ca/` to LinkedIn **Contact info**.
- Add it to the GitHub profile **Website** field and profile README.
- Link it from the Deximon, UrbanSight, and Omni-Nexus repository READMEs.
- Keep the same name, location, degree, and engineering focus across the
  portfolio, LinkedIn, GitHub, and resumes.
- Pursue genuine links from York University capstone pages, teammates, and
  relevant engineering communities. Avoid paid or spam backlinks.

## Optional second search engine

[Bing Webmaster Tools](https://www.bing.com/webmasters/) can import the
verified Google Search Console property and sitemap.

## When content expands

The strongest next on-site SEO improvement is a dedicated URL for each major
case study, with unique engineering detail, title, heading, description, and
canonical URL. Update `dateModified` and the sitemap's `lastmod` only after a
substantial page change.

Useful references:

- [Google SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- [Profile page structured data](https://developers.google.com/search/docs/appearance/structured-data/profile-page)
- [Build and submit a sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
