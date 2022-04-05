const i18n = require('./i18n');

/** @type {import('@docusaurus/types').DocusaurusConfig} */
module.exports = {
  i18n,
  title: 'Ditsmod',
  url: 'https://ditsmod.github.io',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',
  organizationName: 'ditsmod', // Usually your GitHub org/user name.
  projectName: 'ditsmod.github.io', // Usually your repo name.
  themeConfig: {
    navbar: {
      // title: 'Головна',
      logo: {
        alt: 'Ditsmod Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'doc',
          docId: 'intro',
          position: 'left',
          label: 'Документація Ditsmod',
        },
        {
          href: 'https://github.com/ditsmod/ditsmod',
          position: 'right',
          className: 'header-github-link',
          'aria-label': 'GitHub repository',
        },
        // {to: '/blog', label: 'Blog', position: 'left'},
        // {
        //   type: 'docsVersionDropdown',
        // },
        {
          type: 'localeDropdown',
          position: 'right',
        },
      ],
    },
    algolia: {
      appId: 'KXSV6YPHSY',
      apiKey: '4d1c9badb24964d992fb4d1b6badc88e',
      indexName: 'ditsmod',

      // Optional: see doc section below
      contextualSearch: true,

      // Optional: see doc section below
      // appId: 'YOUR_APP_ID',

      // Optional: Algolia search parameters
      // searchParameters: { facetFilters: ["type:content", "language:LANGUAGE"] },

      //... other Algolia params
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Community',
          items: [
            {
              label: 'Stack Overflow',
              href: 'https://stackoverflow.com/questions/tagged/ditsmod',
            },
            {
              label: 'Twitter',
              href: 'https://twitter.com/ditsmod',
            },
          ],
        },
        {
          title: 'More',
          items: [
            // {
            //   label: 'Blog',
            //   to: '/blog',
            // },
            {
              label: 'GitHub',
              href: 'https://github.com/ditsmod/ditsmod',
            },
          ],
        },
      ],
      copyright: `Built with Docusaurus.`,
    },
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        gtag: {
          trackingID: 'G-JB9Z2HZH02',
          // Optional fields.
          // anonymizeIP: true, // Should IPs be anonymized?
        },
        docs: {
          routeBasePath: '/',
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: ({ version, versionDocsDirPath, docPath, locale }) =>
            locale == 'en'
              ? `https://github.com/ditsmod/ditsmod/edit/main/website/i18n/en/docusaurus-plugin-content-docs/${version}/${docPath}`
              : `https://github.com/ditsmod/ditsmod/edit/main/website/${versionDocsDirPath}/${docPath}`,
        },
        // blog: {
        //   showReadingTime: true,
        //   editUrl:
        //     'https://github.com/ditsmod/ditsmod/edit/main/website/blog/',
        // },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],
};
