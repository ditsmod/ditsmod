/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const locales = [
  'en',
  'uk',
];

const localeConfigs = {
  uk: {
    label: 'Українська',
  },
  en: {
    label: 'English',
  },
};

// Docusaurus 2 i18n config
module.exports = {
  defaultLocale: 'uk',
  locales,
  localeConfigs,
};
