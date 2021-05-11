
const i18n = require('./i18n');

/** @type {import('@docusaurus/types').DocusaurusConfig} */
module.exports = {
  i18n,
  title: 'Ditsmod docs',
  tagline: 'Dinosaurs are cool',
  url: 'https://ditsmod.github.io',
  baseUrl: '/ditsmod/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',
  organizationName: 'ditsmod', // Usually your GitHub org/user name.
  projectName: 'ditsmod', // Usually your repo name.
  themeConfig: {
    navbar: {
      title: 'Ditsmod docs',
      logo: {
        alt: 'Ditsmod Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'doc',
          docId: 'intro',
          position: 'left',
          label: 'Tutorial',
        },
        {to: '/blog', label: 'Blog', position: 'left'},
        {
          href: 'https://github.com/ditsmod/ditsmod',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Tutorial',
              to: '/docs/intro',
            },
          ],
        },
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
            {
              label: 'Blog',
              to: '/blog',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/ditsmod/ditsmod',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Ditsmod, Inc. Built with Ditsmod.`,
    },
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl:
            'https://github.com/ditsmod/ditsmod/edit/main/website/',
        },
        blog: {
          showReadingTime: true,
          editUrl:
            'https://github.com/ditsmod/ditsmod/edit/main/website/blog/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],
};
