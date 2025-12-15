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
  trailingSlash: true,
  themeConfig: {
    navbar: {
      // title: 'Головна',
      logo: {
        alt: 'Ditsmod Logo',
        src: 'img/logo.svg',
      },
      items: [
        // {
        //   type: 'doc',
        //   docId: 'intro',
        //   position: 'left',
        //   label: 'Документація Ditsmod',
        // },
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

      // optional: see doc section below
      contextualSearch: true,

      // optional: see doc section below
      // appId: 'YOUR_APP_ID',

      // optional: Algolia search parameters
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
          // optional fields.
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
  plugins: [
    [
      '@docusaurus/plugin-client-redirects',
      {
        // fromExtensions: ['html', 'htm'], // /myPage.html -> /myPage
        // toExtensions: ['exe', 'zip'], // /myAsset -> /myAsset.zip (if latter exists)
        // redirects: [
        //   // Redirect from multiple old paths to the new path
        //   {
        //     to: '/docs/newDoc2',
        //     from: ['/docs/oldDocFrom2019', '/docs/legacyDocFrom2016'],
        //   },
        // ],
        createRedirects(currentPath) {
          const arr = [
            ...getRedirect(currentPath, '/basic-components-of-the-app', ['/components-of-ditsmod-app']),
            ...getRedirect(currentPath, '/native-modules/rest/controllers-and-services', ['/components-of-ditsmod-app/controllers-and-services']),
            ...getRedirect(currentPath, '/native-modules/rest/http-interceptors', ['/components-of-ditsmod-app/http-interceptors']),
            ...getRedirect(currentPath, '/native-modules/rest/guards', ['/components-of-ditsmod-app/guards']),
            ...getRedirect(currentPath, '/native-modules/rest/install', ['/native-modules/rest']),
            ...getRedirect(currentPath, '/developer-guides/exports-and-imports', ['/components-of-ditsmod-app/exports-and-imports']),
            ...getRedirect(currentPath, '/developer-guides/providers-collisions', ['/components-of-ditsmod-app/providers-collisions']),
            ...getRedirect(currentPath, '/basic-components-of-the-app/extensions', ['/extensions/create-extension','/extensions/about-extensions']),
            ...getRedirect(currentPath, '/basic-components-of-the-app', ['/core']),
            ...getRedirect(currentPath, '/native-modules/', ['/published-modules/']),
            ...getRedirect(currentPath, '/native-modules/openapi', ['/extensions/openapi']),
            ...getRedirect(currentPath, '/basic-components-of-the-app/log-mediator', ['/examples/override-core-log-messages']),
          ];
          return arr.length ? arr : undefined; // Return a falsy value: no redirect created
        },
      },
    ],
  ],
};

function getRedirect(currentPath, newPath, oldPaths) {
  const arr = [];
  if (currentPath.includes(newPath)) {
    oldPaths.forEach((oldPath) => {
      arr.push(currentPath.replace(newPath, oldPath));
    });
  }
  return arr;
}
