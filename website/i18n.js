/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// The top-30 locales on Crowdin are enabled
// but we enable only a subset of those
const locales = [
  'en',
  'uk',
];

const localeConfigs = {
  en: {
    label: 'English',
  },
  uk: {
    label: 'Українська',
  },
};

// Docusaurus 2 i18n config
module.exports = {
  defaultLocale: 'en',
  locales,
  localeConfigs,
};
