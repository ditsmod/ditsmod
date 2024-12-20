export class ServicePerApp {
  method() {
    return 'App';
  }
}

export class ServicePerMod {
  method() {
    return 'Mod';
  }
}

export class ServicePerRou {
  method() {
    return 'Rou';
  }
}

export class ServicePerReq {
  method() {
    return 'Req';
  }
}

/**
 * A service that is passed to the DI via controller metadata.
 */
export class ServicePerRou2 {
  method() {
    return 'Rou2';
  }
}

/**
 * A service that is passed to the DI via controller metadata.
 */
export class ServicePerReq2 {
  method() {
    return 'Req2';
  }
}
