---
sidebar_position: 9
---

# HttpErrorHandler

Усі помилки, які виникають під час обробки HTTP-запиту, і які ви не зловили у контролерах, інтерсепторах, або сервісах, потрапляють до [DefaultHttpErrorHandler][1]. Цей обробник передається до реєстру DI на рівні запиту, оскільки він повинен мати доступ до об'єкта HTTP-запиту/відповіді, для можливості формування та відправки відповіді клієнту.











[1]: https://github.com/ditsmod/ditsmod/blob/core-2.43.0/packages/core/src/services/default-http-error-handler.ts
