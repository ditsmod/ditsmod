import {
  AnyObj,
  inject,
  injectable,
  Injector,
  optional,
  Logger,
} from '@ditsmod/core';
import { DictService, I18nErrorMediator, I18nLogMediator, I18nOptions, ISO639 } from '@ditsmod/i18n';
import { QUERY_PARAMS, RAW_REQ, RawRequest } from '@ditsmod/routing';

@injectable()
export class MyDictService extends DictService {
  constructor(
    protected override injector: Injector,
    protected override log: I18nLogMediator,
    protected override errMediator: I18nErrorMediator,
    protected logger: Logger,
    @optional() protected override i18nOptions?: I18nOptions,
    @inject(QUERY_PARAMS) protected override queryParams?: AnyObj,
    @optional() @inject(RAW_REQ) protected rawReq?: RawRequest,
  ) {
    super(injector, log, errMediator, i18nOptions, queryParams);
  }

  override set lng(lng: ISO639) {
    super.lng = lng;
  }

  override get lng() {
    if (this._lng) {
      return this._lng;
    }
    const lng = this.getHeaderLng() || this.queryParams?.[this.i18nOptions?.lngParam || 'lng'];
    return lng || this.i18nOptions?.defaultLng;
  }

  protected getHeaderLng(): ISO639 | void {
    const acceptLanguage = this.rawReq?.headers['accept-language']; // Here string like: uk,en-US;q=0.9,en;q=0.8
    // ... here your code for parsing acceptLanguage, after that you should returns result
    this.logger.log('info', 'works custom DictService');
  }
}
