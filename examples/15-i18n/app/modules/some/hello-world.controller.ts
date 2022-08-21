import { Controller, Res, Route } from '@ditsmod/core';
import { I18nService } from '@ditsmod/i18n';

import { TranslationDefault } from './locales/current/en/translation';

@Controller()
export class HelloWorldController {
  constructor(private res: Res, private i18nService: I18nService) {}

  @Route('GET')
  tellHello() {
    const msg = this.i18nService.translate(TranslationDefault, 'uk', 'hello', 'Костя');

    const hello = this.i18nService.getMethod(TranslationDefault, 'uk', 'hello');
    hello('Костя');

    const dict = this.i18nService.getDictionary(TranslationDefault, 'uk');
    dict.hello('Костя');
    dict.hi();
    
    const dictionaries = this.i18nService.getAllDictionaries(TranslationDefault);
    const dictionary = dictionaries.find(t => t.lng == 'uk');
    dictionary.hello('Костя');
    dictionary.hi();

    this.res.send(msg);
  }
}
