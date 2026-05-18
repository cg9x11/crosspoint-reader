
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model Novel
 * 
 */
export type Novel = $Result.DefaultSelection<Prisma.$NovelPayload>
/**
 * Model Chapter
 * 
 */
export type Chapter = $Result.DefaultSelection<Prisma.$ChapterPayload>
/**
 * Model SyncRun
 * 
 */
export type SyncRun = $Result.DefaultSelection<Prisma.$SyncRunPayload>
/**
 * Model TranslationProject
 * 
 */
export type TranslationProject = $Result.DefaultSelection<Prisma.$TranslationProjectPayload>
/**
 * Model TranslationGlossary
 * 
 */
export type TranslationGlossary = $Result.DefaultSelection<Prisma.$TranslationGlossaryPayload>
/**
 * Model TranslationGlossaryEntry
 * 
 */
export type TranslationGlossaryEntry = $Result.DefaultSelection<Prisma.$TranslationGlossaryEntryPayload>
/**
 * Model ChapterTranslation
 * 
 */
export type ChapterTranslation = $Result.DefaultSelection<Prisma.$ChapterTranslationPayload>
/**
 * Model ChapterTranslationVersion
 * 
 */
export type ChapterTranslationVersion = $Result.DefaultSelection<Prisma.$ChapterTranslationVersionPayload>
/**
 * Model TranslationRun
 * 
 */
export type TranslationRun = $Result.DefaultSelection<Prisma.$TranslationRunPayload>
/**
 * Model PluginSource
 * 
 */
export type PluginSource = $Result.DefaultSelection<Prisma.$PluginSourcePayload>
/**
 * Model AppSetting
 * 
 */
export type AppSetting = $Result.DefaultSelection<Prisma.$AppSettingPayload>

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Novels
 * const novels = await prisma.novel.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Novels
   * const novels = await prisma.novel.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.novel`: Exposes CRUD operations for the **Novel** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Novels
    * const novels = await prisma.novel.findMany()
    * ```
    */
  get novel(): Prisma.NovelDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.chapter`: Exposes CRUD operations for the **Chapter** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Chapters
    * const chapters = await prisma.chapter.findMany()
    * ```
    */
  get chapter(): Prisma.ChapterDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.syncRun`: Exposes CRUD operations for the **SyncRun** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more SyncRuns
    * const syncRuns = await prisma.syncRun.findMany()
    * ```
    */
  get syncRun(): Prisma.SyncRunDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.translationProject`: Exposes CRUD operations for the **TranslationProject** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more TranslationProjects
    * const translationProjects = await prisma.translationProject.findMany()
    * ```
    */
  get translationProject(): Prisma.TranslationProjectDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.translationGlossary`: Exposes CRUD operations for the **TranslationGlossary** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more TranslationGlossaries
    * const translationGlossaries = await prisma.translationGlossary.findMany()
    * ```
    */
  get translationGlossary(): Prisma.TranslationGlossaryDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.translationGlossaryEntry`: Exposes CRUD operations for the **TranslationGlossaryEntry** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more TranslationGlossaryEntries
    * const translationGlossaryEntries = await prisma.translationGlossaryEntry.findMany()
    * ```
    */
  get translationGlossaryEntry(): Prisma.TranslationGlossaryEntryDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.chapterTranslation`: Exposes CRUD operations for the **ChapterTranslation** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ChapterTranslations
    * const chapterTranslations = await prisma.chapterTranslation.findMany()
    * ```
    */
  get chapterTranslation(): Prisma.ChapterTranslationDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.chapterTranslationVersion`: Exposes CRUD operations for the **ChapterTranslationVersion** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ChapterTranslationVersions
    * const chapterTranslationVersions = await prisma.chapterTranslationVersion.findMany()
    * ```
    */
  get chapterTranslationVersion(): Prisma.ChapterTranslationVersionDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.translationRun`: Exposes CRUD operations for the **TranslationRun** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more TranslationRuns
    * const translationRuns = await prisma.translationRun.findMany()
    * ```
    */
  get translationRun(): Prisma.TranslationRunDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.pluginSource`: Exposes CRUD operations for the **PluginSource** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more PluginSources
    * const pluginSources = await prisma.pluginSource.findMany()
    * ```
    */
  get pluginSource(): Prisma.PluginSourceDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.appSetting`: Exposes CRUD operations for the **AppSetting** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more AppSettings
    * const appSettings = await prisma.appSetting.findMany()
    * ```
    */
  get appSetting(): Prisma.AppSettingDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.19.3
   * Query Engine version: c2990dca591cba766e3b7ef5d9e8a84796e47ab7
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import Bytes = runtime.Bytes
  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    Novel: 'Novel',
    Chapter: 'Chapter',
    SyncRun: 'SyncRun',
    TranslationProject: 'TranslationProject',
    TranslationGlossary: 'TranslationGlossary',
    TranslationGlossaryEntry: 'TranslationGlossaryEntry',
    ChapterTranslation: 'ChapterTranslation',
    ChapterTranslationVersion: 'ChapterTranslationVersion',
    TranslationRun: 'TranslationRun',
    PluginSource: 'PluginSource',
    AppSetting: 'AppSetting'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "novel" | "chapter" | "syncRun" | "translationProject" | "translationGlossary" | "translationGlossaryEntry" | "chapterTranslation" | "chapterTranslationVersion" | "translationRun" | "pluginSource" | "appSetting"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      Novel: {
        payload: Prisma.$NovelPayload<ExtArgs>
        fields: Prisma.NovelFieldRefs
        operations: {
          findUnique: {
            args: Prisma.NovelFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NovelPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.NovelFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NovelPayload>
          }
          findFirst: {
            args: Prisma.NovelFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NovelPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.NovelFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NovelPayload>
          }
          findMany: {
            args: Prisma.NovelFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NovelPayload>[]
          }
          create: {
            args: Prisma.NovelCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NovelPayload>
          }
          createMany: {
            args: Prisma.NovelCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.NovelCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NovelPayload>[]
          }
          delete: {
            args: Prisma.NovelDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NovelPayload>
          }
          update: {
            args: Prisma.NovelUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NovelPayload>
          }
          deleteMany: {
            args: Prisma.NovelDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.NovelUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.NovelUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NovelPayload>[]
          }
          upsert: {
            args: Prisma.NovelUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NovelPayload>
          }
          aggregate: {
            args: Prisma.NovelAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateNovel>
          }
          groupBy: {
            args: Prisma.NovelGroupByArgs<ExtArgs>
            result: $Utils.Optional<NovelGroupByOutputType>[]
          }
          count: {
            args: Prisma.NovelCountArgs<ExtArgs>
            result: $Utils.Optional<NovelCountAggregateOutputType> | number
          }
        }
      }
      Chapter: {
        payload: Prisma.$ChapterPayload<ExtArgs>
        fields: Prisma.ChapterFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ChapterFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChapterPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ChapterFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChapterPayload>
          }
          findFirst: {
            args: Prisma.ChapterFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChapterPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ChapterFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChapterPayload>
          }
          findMany: {
            args: Prisma.ChapterFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChapterPayload>[]
          }
          create: {
            args: Prisma.ChapterCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChapterPayload>
          }
          createMany: {
            args: Prisma.ChapterCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ChapterCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChapterPayload>[]
          }
          delete: {
            args: Prisma.ChapterDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChapterPayload>
          }
          update: {
            args: Prisma.ChapterUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChapterPayload>
          }
          deleteMany: {
            args: Prisma.ChapterDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ChapterUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ChapterUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChapterPayload>[]
          }
          upsert: {
            args: Prisma.ChapterUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChapterPayload>
          }
          aggregate: {
            args: Prisma.ChapterAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateChapter>
          }
          groupBy: {
            args: Prisma.ChapterGroupByArgs<ExtArgs>
            result: $Utils.Optional<ChapterGroupByOutputType>[]
          }
          count: {
            args: Prisma.ChapterCountArgs<ExtArgs>
            result: $Utils.Optional<ChapterCountAggregateOutputType> | number
          }
        }
      }
      SyncRun: {
        payload: Prisma.$SyncRunPayload<ExtArgs>
        fields: Prisma.SyncRunFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SyncRunFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SyncRunPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SyncRunFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SyncRunPayload>
          }
          findFirst: {
            args: Prisma.SyncRunFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SyncRunPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SyncRunFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SyncRunPayload>
          }
          findMany: {
            args: Prisma.SyncRunFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SyncRunPayload>[]
          }
          create: {
            args: Prisma.SyncRunCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SyncRunPayload>
          }
          createMany: {
            args: Prisma.SyncRunCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SyncRunCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SyncRunPayload>[]
          }
          delete: {
            args: Prisma.SyncRunDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SyncRunPayload>
          }
          update: {
            args: Prisma.SyncRunUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SyncRunPayload>
          }
          deleteMany: {
            args: Prisma.SyncRunDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SyncRunUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.SyncRunUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SyncRunPayload>[]
          }
          upsert: {
            args: Prisma.SyncRunUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SyncRunPayload>
          }
          aggregate: {
            args: Prisma.SyncRunAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSyncRun>
          }
          groupBy: {
            args: Prisma.SyncRunGroupByArgs<ExtArgs>
            result: $Utils.Optional<SyncRunGroupByOutputType>[]
          }
          count: {
            args: Prisma.SyncRunCountArgs<ExtArgs>
            result: $Utils.Optional<SyncRunCountAggregateOutputType> | number
          }
        }
      }
      TranslationProject: {
        payload: Prisma.$TranslationProjectPayload<ExtArgs>
        fields: Prisma.TranslationProjectFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TranslationProjectFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TranslationProjectPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TranslationProjectFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TranslationProjectPayload>
          }
          findFirst: {
            args: Prisma.TranslationProjectFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TranslationProjectPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TranslationProjectFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TranslationProjectPayload>
          }
          findMany: {
            args: Prisma.TranslationProjectFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TranslationProjectPayload>[]
          }
          create: {
            args: Prisma.TranslationProjectCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TranslationProjectPayload>
          }
          createMany: {
            args: Prisma.TranslationProjectCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.TranslationProjectCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TranslationProjectPayload>[]
          }
          delete: {
            args: Prisma.TranslationProjectDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TranslationProjectPayload>
          }
          update: {
            args: Prisma.TranslationProjectUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TranslationProjectPayload>
          }
          deleteMany: {
            args: Prisma.TranslationProjectDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TranslationProjectUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.TranslationProjectUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TranslationProjectPayload>[]
          }
          upsert: {
            args: Prisma.TranslationProjectUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TranslationProjectPayload>
          }
          aggregate: {
            args: Prisma.TranslationProjectAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTranslationProject>
          }
          groupBy: {
            args: Prisma.TranslationProjectGroupByArgs<ExtArgs>
            result: $Utils.Optional<TranslationProjectGroupByOutputType>[]
          }
          count: {
            args: Prisma.TranslationProjectCountArgs<ExtArgs>
            result: $Utils.Optional<TranslationProjectCountAggregateOutputType> | number
          }
        }
      }
      TranslationGlossary: {
        payload: Prisma.$TranslationGlossaryPayload<ExtArgs>
        fields: Prisma.TranslationGlossaryFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TranslationGlossaryFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TranslationGlossaryPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TranslationGlossaryFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TranslationGlossaryPayload>
          }
          findFirst: {
            args: Prisma.TranslationGlossaryFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TranslationGlossaryPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TranslationGlossaryFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TranslationGlossaryPayload>
          }
          findMany: {
            args: Prisma.TranslationGlossaryFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TranslationGlossaryPayload>[]
          }
          create: {
            args: Prisma.TranslationGlossaryCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TranslationGlossaryPayload>
          }
          createMany: {
            args: Prisma.TranslationGlossaryCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.TranslationGlossaryCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TranslationGlossaryPayload>[]
          }
          delete: {
            args: Prisma.TranslationGlossaryDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TranslationGlossaryPayload>
          }
          update: {
            args: Prisma.TranslationGlossaryUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TranslationGlossaryPayload>
          }
          deleteMany: {
            args: Prisma.TranslationGlossaryDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TranslationGlossaryUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.TranslationGlossaryUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TranslationGlossaryPayload>[]
          }
          upsert: {
            args: Prisma.TranslationGlossaryUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TranslationGlossaryPayload>
          }
          aggregate: {
            args: Prisma.TranslationGlossaryAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTranslationGlossary>
          }
          groupBy: {
            args: Prisma.TranslationGlossaryGroupByArgs<ExtArgs>
            result: $Utils.Optional<TranslationGlossaryGroupByOutputType>[]
          }
          count: {
            args: Prisma.TranslationGlossaryCountArgs<ExtArgs>
            result: $Utils.Optional<TranslationGlossaryCountAggregateOutputType> | number
          }
        }
      }
      TranslationGlossaryEntry: {
        payload: Prisma.$TranslationGlossaryEntryPayload<ExtArgs>
        fields: Prisma.TranslationGlossaryEntryFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TranslationGlossaryEntryFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TranslationGlossaryEntryPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TranslationGlossaryEntryFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TranslationGlossaryEntryPayload>
          }
          findFirst: {
            args: Prisma.TranslationGlossaryEntryFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TranslationGlossaryEntryPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TranslationGlossaryEntryFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TranslationGlossaryEntryPayload>
          }
          findMany: {
            args: Prisma.TranslationGlossaryEntryFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TranslationGlossaryEntryPayload>[]
          }
          create: {
            args: Prisma.TranslationGlossaryEntryCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TranslationGlossaryEntryPayload>
          }
          createMany: {
            args: Prisma.TranslationGlossaryEntryCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.TranslationGlossaryEntryCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TranslationGlossaryEntryPayload>[]
          }
          delete: {
            args: Prisma.TranslationGlossaryEntryDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TranslationGlossaryEntryPayload>
          }
          update: {
            args: Prisma.TranslationGlossaryEntryUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TranslationGlossaryEntryPayload>
          }
          deleteMany: {
            args: Prisma.TranslationGlossaryEntryDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TranslationGlossaryEntryUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.TranslationGlossaryEntryUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TranslationGlossaryEntryPayload>[]
          }
          upsert: {
            args: Prisma.TranslationGlossaryEntryUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TranslationGlossaryEntryPayload>
          }
          aggregate: {
            args: Prisma.TranslationGlossaryEntryAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTranslationGlossaryEntry>
          }
          groupBy: {
            args: Prisma.TranslationGlossaryEntryGroupByArgs<ExtArgs>
            result: $Utils.Optional<TranslationGlossaryEntryGroupByOutputType>[]
          }
          count: {
            args: Prisma.TranslationGlossaryEntryCountArgs<ExtArgs>
            result: $Utils.Optional<TranslationGlossaryEntryCountAggregateOutputType> | number
          }
        }
      }
      ChapterTranslation: {
        payload: Prisma.$ChapterTranslationPayload<ExtArgs>
        fields: Prisma.ChapterTranslationFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ChapterTranslationFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChapterTranslationPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ChapterTranslationFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChapterTranslationPayload>
          }
          findFirst: {
            args: Prisma.ChapterTranslationFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChapterTranslationPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ChapterTranslationFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChapterTranslationPayload>
          }
          findMany: {
            args: Prisma.ChapterTranslationFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChapterTranslationPayload>[]
          }
          create: {
            args: Prisma.ChapterTranslationCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChapterTranslationPayload>
          }
          createMany: {
            args: Prisma.ChapterTranslationCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ChapterTranslationCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChapterTranslationPayload>[]
          }
          delete: {
            args: Prisma.ChapterTranslationDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChapterTranslationPayload>
          }
          update: {
            args: Prisma.ChapterTranslationUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChapterTranslationPayload>
          }
          deleteMany: {
            args: Prisma.ChapterTranslationDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ChapterTranslationUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ChapterTranslationUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChapterTranslationPayload>[]
          }
          upsert: {
            args: Prisma.ChapterTranslationUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChapterTranslationPayload>
          }
          aggregate: {
            args: Prisma.ChapterTranslationAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateChapterTranslation>
          }
          groupBy: {
            args: Prisma.ChapterTranslationGroupByArgs<ExtArgs>
            result: $Utils.Optional<ChapterTranslationGroupByOutputType>[]
          }
          count: {
            args: Prisma.ChapterTranslationCountArgs<ExtArgs>
            result: $Utils.Optional<ChapterTranslationCountAggregateOutputType> | number
          }
        }
      }
      ChapterTranslationVersion: {
        payload: Prisma.$ChapterTranslationVersionPayload<ExtArgs>
        fields: Prisma.ChapterTranslationVersionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ChapterTranslationVersionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChapterTranslationVersionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ChapterTranslationVersionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChapterTranslationVersionPayload>
          }
          findFirst: {
            args: Prisma.ChapterTranslationVersionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChapterTranslationVersionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ChapterTranslationVersionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChapterTranslationVersionPayload>
          }
          findMany: {
            args: Prisma.ChapterTranslationVersionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChapterTranslationVersionPayload>[]
          }
          create: {
            args: Prisma.ChapterTranslationVersionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChapterTranslationVersionPayload>
          }
          createMany: {
            args: Prisma.ChapterTranslationVersionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ChapterTranslationVersionCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChapterTranslationVersionPayload>[]
          }
          delete: {
            args: Prisma.ChapterTranslationVersionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChapterTranslationVersionPayload>
          }
          update: {
            args: Prisma.ChapterTranslationVersionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChapterTranslationVersionPayload>
          }
          deleteMany: {
            args: Prisma.ChapterTranslationVersionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ChapterTranslationVersionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ChapterTranslationVersionUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChapterTranslationVersionPayload>[]
          }
          upsert: {
            args: Prisma.ChapterTranslationVersionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChapterTranslationVersionPayload>
          }
          aggregate: {
            args: Prisma.ChapterTranslationVersionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateChapterTranslationVersion>
          }
          groupBy: {
            args: Prisma.ChapterTranslationVersionGroupByArgs<ExtArgs>
            result: $Utils.Optional<ChapterTranslationVersionGroupByOutputType>[]
          }
          count: {
            args: Prisma.ChapterTranslationVersionCountArgs<ExtArgs>
            result: $Utils.Optional<ChapterTranslationVersionCountAggregateOutputType> | number
          }
        }
      }
      TranslationRun: {
        payload: Prisma.$TranslationRunPayload<ExtArgs>
        fields: Prisma.TranslationRunFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TranslationRunFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TranslationRunPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TranslationRunFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TranslationRunPayload>
          }
          findFirst: {
            args: Prisma.TranslationRunFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TranslationRunPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TranslationRunFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TranslationRunPayload>
          }
          findMany: {
            args: Prisma.TranslationRunFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TranslationRunPayload>[]
          }
          create: {
            args: Prisma.TranslationRunCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TranslationRunPayload>
          }
          createMany: {
            args: Prisma.TranslationRunCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.TranslationRunCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TranslationRunPayload>[]
          }
          delete: {
            args: Prisma.TranslationRunDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TranslationRunPayload>
          }
          update: {
            args: Prisma.TranslationRunUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TranslationRunPayload>
          }
          deleteMany: {
            args: Prisma.TranslationRunDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TranslationRunUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.TranslationRunUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TranslationRunPayload>[]
          }
          upsert: {
            args: Prisma.TranslationRunUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TranslationRunPayload>
          }
          aggregate: {
            args: Prisma.TranslationRunAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTranslationRun>
          }
          groupBy: {
            args: Prisma.TranslationRunGroupByArgs<ExtArgs>
            result: $Utils.Optional<TranslationRunGroupByOutputType>[]
          }
          count: {
            args: Prisma.TranslationRunCountArgs<ExtArgs>
            result: $Utils.Optional<TranslationRunCountAggregateOutputType> | number
          }
        }
      }
      PluginSource: {
        payload: Prisma.$PluginSourcePayload<ExtArgs>
        fields: Prisma.PluginSourceFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PluginSourceFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PluginSourcePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PluginSourceFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PluginSourcePayload>
          }
          findFirst: {
            args: Prisma.PluginSourceFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PluginSourcePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PluginSourceFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PluginSourcePayload>
          }
          findMany: {
            args: Prisma.PluginSourceFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PluginSourcePayload>[]
          }
          create: {
            args: Prisma.PluginSourceCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PluginSourcePayload>
          }
          createMany: {
            args: Prisma.PluginSourceCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.PluginSourceCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PluginSourcePayload>[]
          }
          delete: {
            args: Prisma.PluginSourceDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PluginSourcePayload>
          }
          update: {
            args: Prisma.PluginSourceUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PluginSourcePayload>
          }
          deleteMany: {
            args: Prisma.PluginSourceDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PluginSourceUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.PluginSourceUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PluginSourcePayload>[]
          }
          upsert: {
            args: Prisma.PluginSourceUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PluginSourcePayload>
          }
          aggregate: {
            args: Prisma.PluginSourceAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePluginSource>
          }
          groupBy: {
            args: Prisma.PluginSourceGroupByArgs<ExtArgs>
            result: $Utils.Optional<PluginSourceGroupByOutputType>[]
          }
          count: {
            args: Prisma.PluginSourceCountArgs<ExtArgs>
            result: $Utils.Optional<PluginSourceCountAggregateOutputType> | number
          }
        }
      }
      AppSetting: {
        payload: Prisma.$AppSettingPayload<ExtArgs>
        fields: Prisma.AppSettingFieldRefs
        operations: {
          findUnique: {
            args: Prisma.AppSettingFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AppSettingPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.AppSettingFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AppSettingPayload>
          }
          findFirst: {
            args: Prisma.AppSettingFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AppSettingPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.AppSettingFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AppSettingPayload>
          }
          findMany: {
            args: Prisma.AppSettingFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AppSettingPayload>[]
          }
          create: {
            args: Prisma.AppSettingCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AppSettingPayload>
          }
          createMany: {
            args: Prisma.AppSettingCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.AppSettingCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AppSettingPayload>[]
          }
          delete: {
            args: Prisma.AppSettingDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AppSettingPayload>
          }
          update: {
            args: Prisma.AppSettingUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AppSettingPayload>
          }
          deleteMany: {
            args: Prisma.AppSettingDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.AppSettingUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.AppSettingUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AppSettingPayload>[]
          }
          upsert: {
            args: Prisma.AppSettingUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AppSettingPayload>
          }
          aggregate: {
            args: Prisma.AppSettingAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateAppSetting>
          }
          groupBy: {
            args: Prisma.AppSettingGroupByArgs<ExtArgs>
            result: $Utils.Optional<AppSettingGroupByOutputType>[]
          }
          count: {
            args: Prisma.AppSettingCountArgs<ExtArgs>
            result: $Utils.Optional<AppSettingCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-planetscale`
     */
    adapter?: runtime.SqlDriverAdapterFactory | null
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    novel?: NovelOmit
    chapter?: ChapterOmit
    syncRun?: SyncRunOmit
    translationProject?: TranslationProjectOmit
    translationGlossary?: TranslationGlossaryOmit
    translationGlossaryEntry?: TranslationGlossaryEntryOmit
    chapterTranslation?: ChapterTranslationOmit
    chapterTranslationVersion?: ChapterTranslationVersionOmit
    translationRun?: TranslationRunOmit
    pluginSource?: PluginSourceOmit
    appSetting?: AppSettingOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type NovelCountOutputType
   */

  export type NovelCountOutputType = {
    chapters: number
    syncRuns: number
    translationProjects: number
  }

  export type NovelCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    chapters?: boolean | NovelCountOutputTypeCountChaptersArgs
    syncRuns?: boolean | NovelCountOutputTypeCountSyncRunsArgs
    translationProjects?: boolean | NovelCountOutputTypeCountTranslationProjectsArgs
  }

  // Custom InputTypes
  /**
   * NovelCountOutputType without action
   */
  export type NovelCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NovelCountOutputType
     */
    select?: NovelCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * NovelCountOutputType without action
   */
  export type NovelCountOutputTypeCountChaptersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ChapterWhereInput
  }

  /**
   * NovelCountOutputType without action
   */
  export type NovelCountOutputTypeCountSyncRunsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SyncRunWhereInput
  }

  /**
   * NovelCountOutputType without action
   */
  export type NovelCountOutputTypeCountTranslationProjectsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TranslationProjectWhereInput
  }


  /**
   * Count Type ChapterCountOutputType
   */

  export type ChapterCountOutputType = {
    translations: number
  }

  export type ChapterCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    translations?: boolean | ChapterCountOutputTypeCountTranslationsArgs
  }

  // Custom InputTypes
  /**
   * ChapterCountOutputType without action
   */
  export type ChapterCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChapterCountOutputType
     */
    select?: ChapterCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * ChapterCountOutputType without action
   */
  export type ChapterCountOutputTypeCountTranslationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ChapterTranslationWhereInput
  }


  /**
   * Count Type TranslationProjectCountOutputType
   */

  export type TranslationProjectCountOutputType = {
    glossaries: number
    chapterTranslations: number
    runs: number
  }

  export type TranslationProjectCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    glossaries?: boolean | TranslationProjectCountOutputTypeCountGlossariesArgs
    chapterTranslations?: boolean | TranslationProjectCountOutputTypeCountChapterTranslationsArgs
    runs?: boolean | TranslationProjectCountOutputTypeCountRunsArgs
  }

  // Custom InputTypes
  /**
   * TranslationProjectCountOutputType without action
   */
  export type TranslationProjectCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TranslationProjectCountOutputType
     */
    select?: TranslationProjectCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * TranslationProjectCountOutputType without action
   */
  export type TranslationProjectCountOutputTypeCountGlossariesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TranslationGlossaryWhereInput
  }

  /**
   * TranslationProjectCountOutputType without action
   */
  export type TranslationProjectCountOutputTypeCountChapterTranslationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ChapterTranslationWhereInput
  }

  /**
   * TranslationProjectCountOutputType without action
   */
  export type TranslationProjectCountOutputTypeCountRunsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TranslationRunWhereInput
  }


  /**
   * Count Type TranslationGlossaryCountOutputType
   */

  export type TranslationGlossaryCountOutputType = {
    entries: number
  }

  export type TranslationGlossaryCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    entries?: boolean | TranslationGlossaryCountOutputTypeCountEntriesArgs
  }

  // Custom InputTypes
  /**
   * TranslationGlossaryCountOutputType without action
   */
  export type TranslationGlossaryCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TranslationGlossaryCountOutputType
     */
    select?: TranslationGlossaryCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * TranslationGlossaryCountOutputType without action
   */
  export type TranslationGlossaryCountOutputTypeCountEntriesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TranslationGlossaryEntryWhereInput
  }


  /**
   * Count Type ChapterTranslationCountOutputType
   */

  export type ChapterTranslationCountOutputType = {
    versions: number
  }

  export type ChapterTranslationCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    versions?: boolean | ChapterTranslationCountOutputTypeCountVersionsArgs
  }

  // Custom InputTypes
  /**
   * ChapterTranslationCountOutputType without action
   */
  export type ChapterTranslationCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChapterTranslationCountOutputType
     */
    select?: ChapterTranslationCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * ChapterTranslationCountOutputType without action
   */
  export type ChapterTranslationCountOutputTypeCountVersionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ChapterTranslationVersionWhereInput
  }


  /**
   * Models
   */

  /**
   * Model Novel
   */

  export type AggregateNovel = {
    _count: NovelCountAggregateOutputType | null
    _avg: NovelAvgAggregateOutputType | null
    _sum: NovelSumAggregateOutputType | null
    _min: NovelMinAggregateOutputType | null
    _max: NovelMaxAggregateOutputType | null
  }

  export type NovelAvgAggregateOutputType = {
    totalChapters: number | null
    downloadedChapters: number | null
  }

  export type NovelSumAggregateOutputType = {
    totalChapters: number | null
    downloadedChapters: number | null
  }

  export type NovelMinAggregateOutputType = {
    id: string | null
    title: string | null
    author: string | null
    sourceId: string | null
    sourceName: string | null
    sourceUrl: string | null
    coverUrl: string | null
    coverLocalPath: string | null
    description: string | null
    status: string | null
    syncStatus: string | null
    totalChapters: number | null
    downloadedChapters: number | null
    defaultEditionKind: string | null
    defaultTranslationProjectId: string | null
    lastCheckedAt: Date | null
    lastSyncStartedAt: Date | null
    lastSyncEndedAt: Date | null
    lastError: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type NovelMaxAggregateOutputType = {
    id: string | null
    title: string | null
    author: string | null
    sourceId: string | null
    sourceName: string | null
    sourceUrl: string | null
    coverUrl: string | null
    coverLocalPath: string | null
    description: string | null
    status: string | null
    syncStatus: string | null
    totalChapters: number | null
    downloadedChapters: number | null
    defaultEditionKind: string | null
    defaultTranslationProjectId: string | null
    lastCheckedAt: Date | null
    lastSyncStartedAt: Date | null
    lastSyncEndedAt: Date | null
    lastError: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type NovelCountAggregateOutputType = {
    id: number
    title: number
    author: number
    sourceId: number
    sourceName: number
    sourceUrl: number
    coverUrl: number
    coverLocalPath: number
    description: number
    status: number
    syncStatus: number
    totalChapters: number
    downloadedChapters: number
    defaultEditionKind: number
    defaultTranslationProjectId: number
    lastCheckedAt: number
    lastSyncStartedAt: number
    lastSyncEndedAt: number
    lastError: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type NovelAvgAggregateInputType = {
    totalChapters?: true
    downloadedChapters?: true
  }

  export type NovelSumAggregateInputType = {
    totalChapters?: true
    downloadedChapters?: true
  }

  export type NovelMinAggregateInputType = {
    id?: true
    title?: true
    author?: true
    sourceId?: true
    sourceName?: true
    sourceUrl?: true
    coverUrl?: true
    coverLocalPath?: true
    description?: true
    status?: true
    syncStatus?: true
    totalChapters?: true
    downloadedChapters?: true
    defaultEditionKind?: true
    defaultTranslationProjectId?: true
    lastCheckedAt?: true
    lastSyncStartedAt?: true
    lastSyncEndedAt?: true
    lastError?: true
    createdAt?: true
    updatedAt?: true
  }

  export type NovelMaxAggregateInputType = {
    id?: true
    title?: true
    author?: true
    sourceId?: true
    sourceName?: true
    sourceUrl?: true
    coverUrl?: true
    coverLocalPath?: true
    description?: true
    status?: true
    syncStatus?: true
    totalChapters?: true
    downloadedChapters?: true
    defaultEditionKind?: true
    defaultTranslationProjectId?: true
    lastCheckedAt?: true
    lastSyncStartedAt?: true
    lastSyncEndedAt?: true
    lastError?: true
    createdAt?: true
    updatedAt?: true
  }

  export type NovelCountAggregateInputType = {
    id?: true
    title?: true
    author?: true
    sourceId?: true
    sourceName?: true
    sourceUrl?: true
    coverUrl?: true
    coverLocalPath?: true
    description?: true
    status?: true
    syncStatus?: true
    totalChapters?: true
    downloadedChapters?: true
    defaultEditionKind?: true
    defaultTranslationProjectId?: true
    lastCheckedAt?: true
    lastSyncStartedAt?: true
    lastSyncEndedAt?: true
    lastError?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type NovelAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Novel to aggregate.
     */
    where?: NovelWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Novels to fetch.
     */
    orderBy?: NovelOrderByWithRelationInput | NovelOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: NovelWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Novels from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Novels.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Novels
    **/
    _count?: true | NovelCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: NovelAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: NovelSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: NovelMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: NovelMaxAggregateInputType
  }

  export type GetNovelAggregateType<T extends NovelAggregateArgs> = {
        [P in keyof T & keyof AggregateNovel]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateNovel[P]>
      : GetScalarType<T[P], AggregateNovel[P]>
  }




  export type NovelGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: NovelWhereInput
    orderBy?: NovelOrderByWithAggregationInput | NovelOrderByWithAggregationInput[]
    by: NovelScalarFieldEnum[] | NovelScalarFieldEnum
    having?: NovelScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: NovelCountAggregateInputType | true
    _avg?: NovelAvgAggregateInputType
    _sum?: NovelSumAggregateInputType
    _min?: NovelMinAggregateInputType
    _max?: NovelMaxAggregateInputType
  }

  export type NovelGroupByOutputType = {
    id: string
    title: string
    author: string | null
    sourceId: string
    sourceName: string | null
    sourceUrl: string
    coverUrl: string | null
    coverLocalPath: string | null
    description: string | null
    status: string
    syncStatus: string
    totalChapters: number
    downloadedChapters: number
    defaultEditionKind: string
    defaultTranslationProjectId: string | null
    lastCheckedAt: Date | null
    lastSyncStartedAt: Date | null
    lastSyncEndedAt: Date | null
    lastError: string | null
    createdAt: Date
    updatedAt: Date
    _count: NovelCountAggregateOutputType | null
    _avg: NovelAvgAggregateOutputType | null
    _sum: NovelSumAggregateOutputType | null
    _min: NovelMinAggregateOutputType | null
    _max: NovelMaxAggregateOutputType | null
  }

  type GetNovelGroupByPayload<T extends NovelGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<NovelGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof NovelGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], NovelGroupByOutputType[P]>
            : GetScalarType<T[P], NovelGroupByOutputType[P]>
        }
      >
    >


  export type NovelSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    author?: boolean
    sourceId?: boolean
    sourceName?: boolean
    sourceUrl?: boolean
    coverUrl?: boolean
    coverLocalPath?: boolean
    description?: boolean
    status?: boolean
    syncStatus?: boolean
    totalChapters?: boolean
    downloadedChapters?: boolean
    defaultEditionKind?: boolean
    defaultTranslationProjectId?: boolean
    lastCheckedAt?: boolean
    lastSyncStartedAt?: boolean
    lastSyncEndedAt?: boolean
    lastError?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    chapters?: boolean | Novel$chaptersArgs<ExtArgs>
    syncRuns?: boolean | Novel$syncRunsArgs<ExtArgs>
    translationProjects?: boolean | Novel$translationProjectsArgs<ExtArgs>
    _count?: boolean | NovelCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["novel"]>

  export type NovelSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    author?: boolean
    sourceId?: boolean
    sourceName?: boolean
    sourceUrl?: boolean
    coverUrl?: boolean
    coverLocalPath?: boolean
    description?: boolean
    status?: boolean
    syncStatus?: boolean
    totalChapters?: boolean
    downloadedChapters?: boolean
    defaultEditionKind?: boolean
    defaultTranslationProjectId?: boolean
    lastCheckedAt?: boolean
    lastSyncStartedAt?: boolean
    lastSyncEndedAt?: boolean
    lastError?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["novel"]>

  export type NovelSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    author?: boolean
    sourceId?: boolean
    sourceName?: boolean
    sourceUrl?: boolean
    coverUrl?: boolean
    coverLocalPath?: boolean
    description?: boolean
    status?: boolean
    syncStatus?: boolean
    totalChapters?: boolean
    downloadedChapters?: boolean
    defaultEditionKind?: boolean
    defaultTranslationProjectId?: boolean
    lastCheckedAt?: boolean
    lastSyncStartedAt?: boolean
    lastSyncEndedAt?: boolean
    lastError?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["novel"]>

  export type NovelSelectScalar = {
    id?: boolean
    title?: boolean
    author?: boolean
    sourceId?: boolean
    sourceName?: boolean
    sourceUrl?: boolean
    coverUrl?: boolean
    coverLocalPath?: boolean
    description?: boolean
    status?: boolean
    syncStatus?: boolean
    totalChapters?: boolean
    downloadedChapters?: boolean
    defaultEditionKind?: boolean
    defaultTranslationProjectId?: boolean
    lastCheckedAt?: boolean
    lastSyncStartedAt?: boolean
    lastSyncEndedAt?: boolean
    lastError?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type NovelOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "title" | "author" | "sourceId" | "sourceName" | "sourceUrl" | "coverUrl" | "coverLocalPath" | "description" | "status" | "syncStatus" | "totalChapters" | "downloadedChapters" | "defaultEditionKind" | "defaultTranslationProjectId" | "lastCheckedAt" | "lastSyncStartedAt" | "lastSyncEndedAt" | "lastError" | "createdAt" | "updatedAt", ExtArgs["result"]["novel"]>
  export type NovelInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    chapters?: boolean | Novel$chaptersArgs<ExtArgs>
    syncRuns?: boolean | Novel$syncRunsArgs<ExtArgs>
    translationProjects?: boolean | Novel$translationProjectsArgs<ExtArgs>
    _count?: boolean | NovelCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type NovelIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type NovelIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $NovelPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Novel"
    objects: {
      chapters: Prisma.$ChapterPayload<ExtArgs>[]
      syncRuns: Prisma.$SyncRunPayload<ExtArgs>[]
      translationProjects: Prisma.$TranslationProjectPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      title: string
      author: string | null
      sourceId: string
      sourceName: string | null
      sourceUrl: string
      coverUrl: string | null
      coverLocalPath: string | null
      description: string | null
      status: string
      syncStatus: string
      totalChapters: number
      downloadedChapters: number
      defaultEditionKind: string
      defaultTranslationProjectId: string | null
      lastCheckedAt: Date | null
      lastSyncStartedAt: Date | null
      lastSyncEndedAt: Date | null
      lastError: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["novel"]>
    composites: {}
  }

  type NovelGetPayload<S extends boolean | null | undefined | NovelDefaultArgs> = $Result.GetResult<Prisma.$NovelPayload, S>

  type NovelCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<NovelFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: NovelCountAggregateInputType | true
    }

  export interface NovelDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Novel'], meta: { name: 'Novel' } }
    /**
     * Find zero or one Novel that matches the filter.
     * @param {NovelFindUniqueArgs} args - Arguments to find a Novel
     * @example
     * // Get one Novel
     * const novel = await prisma.novel.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends NovelFindUniqueArgs>(args: SelectSubset<T, NovelFindUniqueArgs<ExtArgs>>): Prisma__NovelClient<$Result.GetResult<Prisma.$NovelPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Novel that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {NovelFindUniqueOrThrowArgs} args - Arguments to find a Novel
     * @example
     * // Get one Novel
     * const novel = await prisma.novel.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends NovelFindUniqueOrThrowArgs>(args: SelectSubset<T, NovelFindUniqueOrThrowArgs<ExtArgs>>): Prisma__NovelClient<$Result.GetResult<Prisma.$NovelPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Novel that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NovelFindFirstArgs} args - Arguments to find a Novel
     * @example
     * // Get one Novel
     * const novel = await prisma.novel.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends NovelFindFirstArgs>(args?: SelectSubset<T, NovelFindFirstArgs<ExtArgs>>): Prisma__NovelClient<$Result.GetResult<Prisma.$NovelPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Novel that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NovelFindFirstOrThrowArgs} args - Arguments to find a Novel
     * @example
     * // Get one Novel
     * const novel = await prisma.novel.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends NovelFindFirstOrThrowArgs>(args?: SelectSubset<T, NovelFindFirstOrThrowArgs<ExtArgs>>): Prisma__NovelClient<$Result.GetResult<Prisma.$NovelPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Novels that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NovelFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Novels
     * const novels = await prisma.novel.findMany()
     * 
     * // Get first 10 Novels
     * const novels = await prisma.novel.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const novelWithIdOnly = await prisma.novel.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends NovelFindManyArgs>(args?: SelectSubset<T, NovelFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$NovelPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Novel.
     * @param {NovelCreateArgs} args - Arguments to create a Novel.
     * @example
     * // Create one Novel
     * const Novel = await prisma.novel.create({
     *   data: {
     *     // ... data to create a Novel
     *   }
     * })
     * 
     */
    create<T extends NovelCreateArgs>(args: SelectSubset<T, NovelCreateArgs<ExtArgs>>): Prisma__NovelClient<$Result.GetResult<Prisma.$NovelPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Novels.
     * @param {NovelCreateManyArgs} args - Arguments to create many Novels.
     * @example
     * // Create many Novels
     * const novel = await prisma.novel.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends NovelCreateManyArgs>(args?: SelectSubset<T, NovelCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Novels and returns the data saved in the database.
     * @param {NovelCreateManyAndReturnArgs} args - Arguments to create many Novels.
     * @example
     * // Create many Novels
     * const novel = await prisma.novel.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Novels and only return the `id`
     * const novelWithIdOnly = await prisma.novel.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends NovelCreateManyAndReturnArgs>(args?: SelectSubset<T, NovelCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$NovelPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Novel.
     * @param {NovelDeleteArgs} args - Arguments to delete one Novel.
     * @example
     * // Delete one Novel
     * const Novel = await prisma.novel.delete({
     *   where: {
     *     // ... filter to delete one Novel
     *   }
     * })
     * 
     */
    delete<T extends NovelDeleteArgs>(args: SelectSubset<T, NovelDeleteArgs<ExtArgs>>): Prisma__NovelClient<$Result.GetResult<Prisma.$NovelPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Novel.
     * @param {NovelUpdateArgs} args - Arguments to update one Novel.
     * @example
     * // Update one Novel
     * const novel = await prisma.novel.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends NovelUpdateArgs>(args: SelectSubset<T, NovelUpdateArgs<ExtArgs>>): Prisma__NovelClient<$Result.GetResult<Prisma.$NovelPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Novels.
     * @param {NovelDeleteManyArgs} args - Arguments to filter Novels to delete.
     * @example
     * // Delete a few Novels
     * const { count } = await prisma.novel.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends NovelDeleteManyArgs>(args?: SelectSubset<T, NovelDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Novels.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NovelUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Novels
     * const novel = await prisma.novel.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends NovelUpdateManyArgs>(args: SelectSubset<T, NovelUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Novels and returns the data updated in the database.
     * @param {NovelUpdateManyAndReturnArgs} args - Arguments to update many Novels.
     * @example
     * // Update many Novels
     * const novel = await prisma.novel.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Novels and only return the `id`
     * const novelWithIdOnly = await prisma.novel.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends NovelUpdateManyAndReturnArgs>(args: SelectSubset<T, NovelUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$NovelPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Novel.
     * @param {NovelUpsertArgs} args - Arguments to update or create a Novel.
     * @example
     * // Update or create a Novel
     * const novel = await prisma.novel.upsert({
     *   create: {
     *     // ... data to create a Novel
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Novel we want to update
     *   }
     * })
     */
    upsert<T extends NovelUpsertArgs>(args: SelectSubset<T, NovelUpsertArgs<ExtArgs>>): Prisma__NovelClient<$Result.GetResult<Prisma.$NovelPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Novels.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NovelCountArgs} args - Arguments to filter Novels to count.
     * @example
     * // Count the number of Novels
     * const count = await prisma.novel.count({
     *   where: {
     *     // ... the filter for the Novels we want to count
     *   }
     * })
    **/
    count<T extends NovelCountArgs>(
      args?: Subset<T, NovelCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], NovelCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Novel.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NovelAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends NovelAggregateArgs>(args: Subset<T, NovelAggregateArgs>): Prisma.PrismaPromise<GetNovelAggregateType<T>>

    /**
     * Group by Novel.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NovelGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends NovelGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: NovelGroupByArgs['orderBy'] }
        : { orderBy?: NovelGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, NovelGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetNovelGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Novel model
   */
  readonly fields: NovelFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Novel.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__NovelClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    chapters<T extends Novel$chaptersArgs<ExtArgs> = {}>(args?: Subset<T, Novel$chaptersArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ChapterPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    syncRuns<T extends Novel$syncRunsArgs<ExtArgs> = {}>(args?: Subset<T, Novel$syncRunsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SyncRunPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    translationProjects<T extends Novel$translationProjectsArgs<ExtArgs> = {}>(args?: Subset<T, Novel$translationProjectsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TranslationProjectPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Novel model
   */
  interface NovelFieldRefs {
    readonly id: FieldRef<"Novel", 'String'>
    readonly title: FieldRef<"Novel", 'String'>
    readonly author: FieldRef<"Novel", 'String'>
    readonly sourceId: FieldRef<"Novel", 'String'>
    readonly sourceName: FieldRef<"Novel", 'String'>
    readonly sourceUrl: FieldRef<"Novel", 'String'>
    readonly coverUrl: FieldRef<"Novel", 'String'>
    readonly coverLocalPath: FieldRef<"Novel", 'String'>
    readonly description: FieldRef<"Novel", 'String'>
    readonly status: FieldRef<"Novel", 'String'>
    readonly syncStatus: FieldRef<"Novel", 'String'>
    readonly totalChapters: FieldRef<"Novel", 'Int'>
    readonly downloadedChapters: FieldRef<"Novel", 'Int'>
    readonly defaultEditionKind: FieldRef<"Novel", 'String'>
    readonly defaultTranslationProjectId: FieldRef<"Novel", 'String'>
    readonly lastCheckedAt: FieldRef<"Novel", 'DateTime'>
    readonly lastSyncStartedAt: FieldRef<"Novel", 'DateTime'>
    readonly lastSyncEndedAt: FieldRef<"Novel", 'DateTime'>
    readonly lastError: FieldRef<"Novel", 'String'>
    readonly createdAt: FieldRef<"Novel", 'DateTime'>
    readonly updatedAt: FieldRef<"Novel", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Novel findUnique
   */
  export type NovelFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Novel
     */
    select?: NovelSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Novel
     */
    omit?: NovelOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NovelInclude<ExtArgs> | null
    /**
     * Filter, which Novel to fetch.
     */
    where: NovelWhereUniqueInput
  }

  /**
   * Novel findUniqueOrThrow
   */
  export type NovelFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Novel
     */
    select?: NovelSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Novel
     */
    omit?: NovelOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NovelInclude<ExtArgs> | null
    /**
     * Filter, which Novel to fetch.
     */
    where: NovelWhereUniqueInput
  }

  /**
   * Novel findFirst
   */
  export type NovelFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Novel
     */
    select?: NovelSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Novel
     */
    omit?: NovelOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NovelInclude<ExtArgs> | null
    /**
     * Filter, which Novel to fetch.
     */
    where?: NovelWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Novels to fetch.
     */
    orderBy?: NovelOrderByWithRelationInput | NovelOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Novels.
     */
    cursor?: NovelWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Novels from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Novels.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Novels.
     */
    distinct?: NovelScalarFieldEnum | NovelScalarFieldEnum[]
  }

  /**
   * Novel findFirstOrThrow
   */
  export type NovelFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Novel
     */
    select?: NovelSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Novel
     */
    omit?: NovelOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NovelInclude<ExtArgs> | null
    /**
     * Filter, which Novel to fetch.
     */
    where?: NovelWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Novels to fetch.
     */
    orderBy?: NovelOrderByWithRelationInput | NovelOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Novels.
     */
    cursor?: NovelWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Novels from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Novels.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Novels.
     */
    distinct?: NovelScalarFieldEnum | NovelScalarFieldEnum[]
  }

  /**
   * Novel findMany
   */
  export type NovelFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Novel
     */
    select?: NovelSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Novel
     */
    omit?: NovelOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NovelInclude<ExtArgs> | null
    /**
     * Filter, which Novels to fetch.
     */
    where?: NovelWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Novels to fetch.
     */
    orderBy?: NovelOrderByWithRelationInput | NovelOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Novels.
     */
    cursor?: NovelWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Novels from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Novels.
     */
    skip?: number
    distinct?: NovelScalarFieldEnum | NovelScalarFieldEnum[]
  }

  /**
   * Novel create
   */
  export type NovelCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Novel
     */
    select?: NovelSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Novel
     */
    omit?: NovelOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NovelInclude<ExtArgs> | null
    /**
     * The data needed to create a Novel.
     */
    data: XOR<NovelCreateInput, NovelUncheckedCreateInput>
  }

  /**
   * Novel createMany
   */
  export type NovelCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Novels.
     */
    data: NovelCreateManyInput | NovelCreateManyInput[]
  }

  /**
   * Novel createManyAndReturn
   */
  export type NovelCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Novel
     */
    select?: NovelSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Novel
     */
    omit?: NovelOmit<ExtArgs> | null
    /**
     * The data used to create many Novels.
     */
    data: NovelCreateManyInput | NovelCreateManyInput[]
  }

  /**
   * Novel update
   */
  export type NovelUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Novel
     */
    select?: NovelSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Novel
     */
    omit?: NovelOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NovelInclude<ExtArgs> | null
    /**
     * The data needed to update a Novel.
     */
    data: XOR<NovelUpdateInput, NovelUncheckedUpdateInput>
    /**
     * Choose, which Novel to update.
     */
    where: NovelWhereUniqueInput
  }

  /**
   * Novel updateMany
   */
  export type NovelUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Novels.
     */
    data: XOR<NovelUpdateManyMutationInput, NovelUncheckedUpdateManyInput>
    /**
     * Filter which Novels to update
     */
    where?: NovelWhereInput
    /**
     * Limit how many Novels to update.
     */
    limit?: number
  }

  /**
   * Novel updateManyAndReturn
   */
  export type NovelUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Novel
     */
    select?: NovelSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Novel
     */
    omit?: NovelOmit<ExtArgs> | null
    /**
     * The data used to update Novels.
     */
    data: XOR<NovelUpdateManyMutationInput, NovelUncheckedUpdateManyInput>
    /**
     * Filter which Novels to update
     */
    where?: NovelWhereInput
    /**
     * Limit how many Novels to update.
     */
    limit?: number
  }

  /**
   * Novel upsert
   */
  export type NovelUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Novel
     */
    select?: NovelSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Novel
     */
    omit?: NovelOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NovelInclude<ExtArgs> | null
    /**
     * The filter to search for the Novel to update in case it exists.
     */
    where: NovelWhereUniqueInput
    /**
     * In case the Novel found by the `where` argument doesn't exist, create a new Novel with this data.
     */
    create: XOR<NovelCreateInput, NovelUncheckedCreateInput>
    /**
     * In case the Novel was found with the provided `where` argument, update it with this data.
     */
    update: XOR<NovelUpdateInput, NovelUncheckedUpdateInput>
  }

  /**
   * Novel delete
   */
  export type NovelDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Novel
     */
    select?: NovelSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Novel
     */
    omit?: NovelOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NovelInclude<ExtArgs> | null
    /**
     * Filter which Novel to delete.
     */
    where: NovelWhereUniqueInput
  }

  /**
   * Novel deleteMany
   */
  export type NovelDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Novels to delete
     */
    where?: NovelWhereInput
    /**
     * Limit how many Novels to delete.
     */
    limit?: number
  }

  /**
   * Novel.chapters
   */
  export type Novel$chaptersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Chapter
     */
    select?: ChapterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Chapter
     */
    omit?: ChapterOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChapterInclude<ExtArgs> | null
    where?: ChapterWhereInput
    orderBy?: ChapterOrderByWithRelationInput | ChapterOrderByWithRelationInput[]
    cursor?: ChapterWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ChapterScalarFieldEnum | ChapterScalarFieldEnum[]
  }

  /**
   * Novel.syncRuns
   */
  export type Novel$syncRunsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SyncRun
     */
    select?: SyncRunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SyncRun
     */
    omit?: SyncRunOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SyncRunInclude<ExtArgs> | null
    where?: SyncRunWhereInput
    orderBy?: SyncRunOrderByWithRelationInput | SyncRunOrderByWithRelationInput[]
    cursor?: SyncRunWhereUniqueInput
    take?: number
    skip?: number
    distinct?: SyncRunScalarFieldEnum | SyncRunScalarFieldEnum[]
  }

  /**
   * Novel.translationProjects
   */
  export type Novel$translationProjectsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TranslationProject
     */
    select?: TranslationProjectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TranslationProject
     */
    omit?: TranslationProjectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TranslationProjectInclude<ExtArgs> | null
    where?: TranslationProjectWhereInput
    orderBy?: TranslationProjectOrderByWithRelationInput | TranslationProjectOrderByWithRelationInput[]
    cursor?: TranslationProjectWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TranslationProjectScalarFieldEnum | TranslationProjectScalarFieldEnum[]
  }

  /**
   * Novel without action
   */
  export type NovelDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Novel
     */
    select?: NovelSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Novel
     */
    omit?: NovelOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NovelInclude<ExtArgs> | null
  }


  /**
   * Model Chapter
   */

  export type AggregateChapter = {
    _count: ChapterCountAggregateOutputType | null
    _avg: ChapterAvgAggregateOutputType | null
    _sum: ChapterSumAggregateOutputType | null
    _min: ChapterMinAggregateOutputType | null
    _max: ChapterMaxAggregateOutputType | null
  }

  export type ChapterAvgAggregateOutputType = {
    chapterIndex: number | null
    fileSize: number | null
    retryCount: number | null
  }

  export type ChapterSumAggregateOutputType = {
    chapterIndex: number | null
    fileSize: number | null
    retryCount: number | null
  }

  export type ChapterMinAggregateOutputType = {
    id: string | null
    novelId: string | null
    chapterIndex: number | null
    title: string | null
    sourceUrl: string | null
    status: string | null
    epubPath: string | null
    fileSize: number | null
    checksum: string | null
    retryCount: number | null
    publishedAt: Date | null
    lastError: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ChapterMaxAggregateOutputType = {
    id: string | null
    novelId: string | null
    chapterIndex: number | null
    title: string | null
    sourceUrl: string | null
    status: string | null
    epubPath: string | null
    fileSize: number | null
    checksum: string | null
    retryCount: number | null
    publishedAt: Date | null
    lastError: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ChapterCountAggregateOutputType = {
    id: number
    novelId: number
    chapterIndex: number
    title: number
    sourceUrl: number
    status: number
    epubPath: number
    fileSize: number
    checksum: number
    retryCount: number
    publishedAt: number
    lastError: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type ChapterAvgAggregateInputType = {
    chapterIndex?: true
    fileSize?: true
    retryCount?: true
  }

  export type ChapterSumAggregateInputType = {
    chapterIndex?: true
    fileSize?: true
    retryCount?: true
  }

  export type ChapterMinAggregateInputType = {
    id?: true
    novelId?: true
    chapterIndex?: true
    title?: true
    sourceUrl?: true
    status?: true
    epubPath?: true
    fileSize?: true
    checksum?: true
    retryCount?: true
    publishedAt?: true
    lastError?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ChapterMaxAggregateInputType = {
    id?: true
    novelId?: true
    chapterIndex?: true
    title?: true
    sourceUrl?: true
    status?: true
    epubPath?: true
    fileSize?: true
    checksum?: true
    retryCount?: true
    publishedAt?: true
    lastError?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ChapterCountAggregateInputType = {
    id?: true
    novelId?: true
    chapterIndex?: true
    title?: true
    sourceUrl?: true
    status?: true
    epubPath?: true
    fileSize?: true
    checksum?: true
    retryCount?: true
    publishedAt?: true
    lastError?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type ChapterAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Chapter to aggregate.
     */
    where?: ChapterWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Chapters to fetch.
     */
    orderBy?: ChapterOrderByWithRelationInput | ChapterOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ChapterWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Chapters from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Chapters.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Chapters
    **/
    _count?: true | ChapterCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ChapterAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ChapterSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ChapterMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ChapterMaxAggregateInputType
  }

  export type GetChapterAggregateType<T extends ChapterAggregateArgs> = {
        [P in keyof T & keyof AggregateChapter]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateChapter[P]>
      : GetScalarType<T[P], AggregateChapter[P]>
  }




  export type ChapterGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ChapterWhereInput
    orderBy?: ChapterOrderByWithAggregationInput | ChapterOrderByWithAggregationInput[]
    by: ChapterScalarFieldEnum[] | ChapterScalarFieldEnum
    having?: ChapterScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ChapterCountAggregateInputType | true
    _avg?: ChapterAvgAggregateInputType
    _sum?: ChapterSumAggregateInputType
    _min?: ChapterMinAggregateInputType
    _max?: ChapterMaxAggregateInputType
  }

  export type ChapterGroupByOutputType = {
    id: string
    novelId: string
    chapterIndex: number
    title: string
    sourceUrl: string
    status: string
    epubPath: string | null
    fileSize: number | null
    checksum: string | null
    retryCount: number
    publishedAt: Date | null
    lastError: string | null
    createdAt: Date
    updatedAt: Date
    _count: ChapterCountAggregateOutputType | null
    _avg: ChapterAvgAggregateOutputType | null
    _sum: ChapterSumAggregateOutputType | null
    _min: ChapterMinAggregateOutputType | null
    _max: ChapterMaxAggregateOutputType | null
  }

  type GetChapterGroupByPayload<T extends ChapterGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ChapterGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ChapterGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ChapterGroupByOutputType[P]>
            : GetScalarType<T[P], ChapterGroupByOutputType[P]>
        }
      >
    >


  export type ChapterSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    novelId?: boolean
    chapterIndex?: boolean
    title?: boolean
    sourceUrl?: boolean
    status?: boolean
    epubPath?: boolean
    fileSize?: boolean
    checksum?: boolean
    retryCount?: boolean
    publishedAt?: boolean
    lastError?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    novel?: boolean | NovelDefaultArgs<ExtArgs>
    translations?: boolean | Chapter$translationsArgs<ExtArgs>
    _count?: boolean | ChapterCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["chapter"]>

  export type ChapterSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    novelId?: boolean
    chapterIndex?: boolean
    title?: boolean
    sourceUrl?: boolean
    status?: boolean
    epubPath?: boolean
    fileSize?: boolean
    checksum?: boolean
    retryCount?: boolean
    publishedAt?: boolean
    lastError?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    novel?: boolean | NovelDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["chapter"]>

  export type ChapterSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    novelId?: boolean
    chapterIndex?: boolean
    title?: boolean
    sourceUrl?: boolean
    status?: boolean
    epubPath?: boolean
    fileSize?: boolean
    checksum?: boolean
    retryCount?: boolean
    publishedAt?: boolean
    lastError?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    novel?: boolean | NovelDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["chapter"]>

  export type ChapterSelectScalar = {
    id?: boolean
    novelId?: boolean
    chapterIndex?: boolean
    title?: boolean
    sourceUrl?: boolean
    status?: boolean
    epubPath?: boolean
    fileSize?: boolean
    checksum?: boolean
    retryCount?: boolean
    publishedAt?: boolean
    lastError?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type ChapterOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "novelId" | "chapterIndex" | "title" | "sourceUrl" | "status" | "epubPath" | "fileSize" | "checksum" | "retryCount" | "publishedAt" | "lastError" | "createdAt" | "updatedAt", ExtArgs["result"]["chapter"]>
  export type ChapterInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    novel?: boolean | NovelDefaultArgs<ExtArgs>
    translations?: boolean | Chapter$translationsArgs<ExtArgs>
    _count?: boolean | ChapterCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type ChapterIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    novel?: boolean | NovelDefaultArgs<ExtArgs>
  }
  export type ChapterIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    novel?: boolean | NovelDefaultArgs<ExtArgs>
  }

  export type $ChapterPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Chapter"
    objects: {
      novel: Prisma.$NovelPayload<ExtArgs>
      translations: Prisma.$ChapterTranslationPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      novelId: string
      chapterIndex: number
      title: string
      sourceUrl: string
      status: string
      epubPath: string | null
      fileSize: number | null
      checksum: string | null
      retryCount: number
      publishedAt: Date | null
      lastError: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["chapter"]>
    composites: {}
  }

  type ChapterGetPayload<S extends boolean | null | undefined | ChapterDefaultArgs> = $Result.GetResult<Prisma.$ChapterPayload, S>

  type ChapterCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ChapterFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ChapterCountAggregateInputType | true
    }

  export interface ChapterDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Chapter'], meta: { name: 'Chapter' } }
    /**
     * Find zero or one Chapter that matches the filter.
     * @param {ChapterFindUniqueArgs} args - Arguments to find a Chapter
     * @example
     * // Get one Chapter
     * const chapter = await prisma.chapter.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ChapterFindUniqueArgs>(args: SelectSubset<T, ChapterFindUniqueArgs<ExtArgs>>): Prisma__ChapterClient<$Result.GetResult<Prisma.$ChapterPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Chapter that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ChapterFindUniqueOrThrowArgs} args - Arguments to find a Chapter
     * @example
     * // Get one Chapter
     * const chapter = await prisma.chapter.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ChapterFindUniqueOrThrowArgs>(args: SelectSubset<T, ChapterFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ChapterClient<$Result.GetResult<Prisma.$ChapterPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Chapter that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChapterFindFirstArgs} args - Arguments to find a Chapter
     * @example
     * // Get one Chapter
     * const chapter = await prisma.chapter.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ChapterFindFirstArgs>(args?: SelectSubset<T, ChapterFindFirstArgs<ExtArgs>>): Prisma__ChapterClient<$Result.GetResult<Prisma.$ChapterPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Chapter that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChapterFindFirstOrThrowArgs} args - Arguments to find a Chapter
     * @example
     * // Get one Chapter
     * const chapter = await prisma.chapter.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ChapterFindFirstOrThrowArgs>(args?: SelectSubset<T, ChapterFindFirstOrThrowArgs<ExtArgs>>): Prisma__ChapterClient<$Result.GetResult<Prisma.$ChapterPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Chapters that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChapterFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Chapters
     * const chapters = await prisma.chapter.findMany()
     * 
     * // Get first 10 Chapters
     * const chapters = await prisma.chapter.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const chapterWithIdOnly = await prisma.chapter.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ChapterFindManyArgs>(args?: SelectSubset<T, ChapterFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ChapterPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Chapter.
     * @param {ChapterCreateArgs} args - Arguments to create a Chapter.
     * @example
     * // Create one Chapter
     * const Chapter = await prisma.chapter.create({
     *   data: {
     *     // ... data to create a Chapter
     *   }
     * })
     * 
     */
    create<T extends ChapterCreateArgs>(args: SelectSubset<T, ChapterCreateArgs<ExtArgs>>): Prisma__ChapterClient<$Result.GetResult<Prisma.$ChapterPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Chapters.
     * @param {ChapterCreateManyArgs} args - Arguments to create many Chapters.
     * @example
     * // Create many Chapters
     * const chapter = await prisma.chapter.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ChapterCreateManyArgs>(args?: SelectSubset<T, ChapterCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Chapters and returns the data saved in the database.
     * @param {ChapterCreateManyAndReturnArgs} args - Arguments to create many Chapters.
     * @example
     * // Create many Chapters
     * const chapter = await prisma.chapter.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Chapters and only return the `id`
     * const chapterWithIdOnly = await prisma.chapter.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ChapterCreateManyAndReturnArgs>(args?: SelectSubset<T, ChapterCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ChapterPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Chapter.
     * @param {ChapterDeleteArgs} args - Arguments to delete one Chapter.
     * @example
     * // Delete one Chapter
     * const Chapter = await prisma.chapter.delete({
     *   where: {
     *     // ... filter to delete one Chapter
     *   }
     * })
     * 
     */
    delete<T extends ChapterDeleteArgs>(args: SelectSubset<T, ChapterDeleteArgs<ExtArgs>>): Prisma__ChapterClient<$Result.GetResult<Prisma.$ChapterPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Chapter.
     * @param {ChapterUpdateArgs} args - Arguments to update one Chapter.
     * @example
     * // Update one Chapter
     * const chapter = await prisma.chapter.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ChapterUpdateArgs>(args: SelectSubset<T, ChapterUpdateArgs<ExtArgs>>): Prisma__ChapterClient<$Result.GetResult<Prisma.$ChapterPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Chapters.
     * @param {ChapterDeleteManyArgs} args - Arguments to filter Chapters to delete.
     * @example
     * // Delete a few Chapters
     * const { count } = await prisma.chapter.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ChapterDeleteManyArgs>(args?: SelectSubset<T, ChapterDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Chapters.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChapterUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Chapters
     * const chapter = await prisma.chapter.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ChapterUpdateManyArgs>(args: SelectSubset<T, ChapterUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Chapters and returns the data updated in the database.
     * @param {ChapterUpdateManyAndReturnArgs} args - Arguments to update many Chapters.
     * @example
     * // Update many Chapters
     * const chapter = await prisma.chapter.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Chapters and only return the `id`
     * const chapterWithIdOnly = await prisma.chapter.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ChapterUpdateManyAndReturnArgs>(args: SelectSubset<T, ChapterUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ChapterPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Chapter.
     * @param {ChapterUpsertArgs} args - Arguments to update or create a Chapter.
     * @example
     * // Update or create a Chapter
     * const chapter = await prisma.chapter.upsert({
     *   create: {
     *     // ... data to create a Chapter
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Chapter we want to update
     *   }
     * })
     */
    upsert<T extends ChapterUpsertArgs>(args: SelectSubset<T, ChapterUpsertArgs<ExtArgs>>): Prisma__ChapterClient<$Result.GetResult<Prisma.$ChapterPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Chapters.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChapterCountArgs} args - Arguments to filter Chapters to count.
     * @example
     * // Count the number of Chapters
     * const count = await prisma.chapter.count({
     *   where: {
     *     // ... the filter for the Chapters we want to count
     *   }
     * })
    **/
    count<T extends ChapterCountArgs>(
      args?: Subset<T, ChapterCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ChapterCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Chapter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChapterAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ChapterAggregateArgs>(args: Subset<T, ChapterAggregateArgs>): Prisma.PrismaPromise<GetChapterAggregateType<T>>

    /**
     * Group by Chapter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChapterGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ChapterGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ChapterGroupByArgs['orderBy'] }
        : { orderBy?: ChapterGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ChapterGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetChapterGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Chapter model
   */
  readonly fields: ChapterFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Chapter.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ChapterClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    novel<T extends NovelDefaultArgs<ExtArgs> = {}>(args?: Subset<T, NovelDefaultArgs<ExtArgs>>): Prisma__NovelClient<$Result.GetResult<Prisma.$NovelPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    translations<T extends Chapter$translationsArgs<ExtArgs> = {}>(args?: Subset<T, Chapter$translationsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ChapterTranslationPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Chapter model
   */
  interface ChapterFieldRefs {
    readonly id: FieldRef<"Chapter", 'String'>
    readonly novelId: FieldRef<"Chapter", 'String'>
    readonly chapterIndex: FieldRef<"Chapter", 'Int'>
    readonly title: FieldRef<"Chapter", 'String'>
    readonly sourceUrl: FieldRef<"Chapter", 'String'>
    readonly status: FieldRef<"Chapter", 'String'>
    readonly epubPath: FieldRef<"Chapter", 'String'>
    readonly fileSize: FieldRef<"Chapter", 'Int'>
    readonly checksum: FieldRef<"Chapter", 'String'>
    readonly retryCount: FieldRef<"Chapter", 'Int'>
    readonly publishedAt: FieldRef<"Chapter", 'DateTime'>
    readonly lastError: FieldRef<"Chapter", 'String'>
    readonly createdAt: FieldRef<"Chapter", 'DateTime'>
    readonly updatedAt: FieldRef<"Chapter", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Chapter findUnique
   */
  export type ChapterFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Chapter
     */
    select?: ChapterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Chapter
     */
    omit?: ChapterOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChapterInclude<ExtArgs> | null
    /**
     * Filter, which Chapter to fetch.
     */
    where: ChapterWhereUniqueInput
  }

  /**
   * Chapter findUniqueOrThrow
   */
  export type ChapterFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Chapter
     */
    select?: ChapterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Chapter
     */
    omit?: ChapterOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChapterInclude<ExtArgs> | null
    /**
     * Filter, which Chapter to fetch.
     */
    where: ChapterWhereUniqueInput
  }

  /**
   * Chapter findFirst
   */
  export type ChapterFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Chapter
     */
    select?: ChapterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Chapter
     */
    omit?: ChapterOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChapterInclude<ExtArgs> | null
    /**
     * Filter, which Chapter to fetch.
     */
    where?: ChapterWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Chapters to fetch.
     */
    orderBy?: ChapterOrderByWithRelationInput | ChapterOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Chapters.
     */
    cursor?: ChapterWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Chapters from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Chapters.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Chapters.
     */
    distinct?: ChapterScalarFieldEnum | ChapterScalarFieldEnum[]
  }

  /**
   * Chapter findFirstOrThrow
   */
  export type ChapterFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Chapter
     */
    select?: ChapterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Chapter
     */
    omit?: ChapterOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChapterInclude<ExtArgs> | null
    /**
     * Filter, which Chapter to fetch.
     */
    where?: ChapterWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Chapters to fetch.
     */
    orderBy?: ChapterOrderByWithRelationInput | ChapterOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Chapters.
     */
    cursor?: ChapterWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Chapters from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Chapters.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Chapters.
     */
    distinct?: ChapterScalarFieldEnum | ChapterScalarFieldEnum[]
  }

  /**
   * Chapter findMany
   */
  export type ChapterFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Chapter
     */
    select?: ChapterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Chapter
     */
    omit?: ChapterOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChapterInclude<ExtArgs> | null
    /**
     * Filter, which Chapters to fetch.
     */
    where?: ChapterWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Chapters to fetch.
     */
    orderBy?: ChapterOrderByWithRelationInput | ChapterOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Chapters.
     */
    cursor?: ChapterWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Chapters from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Chapters.
     */
    skip?: number
    distinct?: ChapterScalarFieldEnum | ChapterScalarFieldEnum[]
  }

  /**
   * Chapter create
   */
  export type ChapterCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Chapter
     */
    select?: ChapterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Chapter
     */
    omit?: ChapterOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChapterInclude<ExtArgs> | null
    /**
     * The data needed to create a Chapter.
     */
    data: XOR<ChapterCreateInput, ChapterUncheckedCreateInput>
  }

  /**
   * Chapter createMany
   */
  export type ChapterCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Chapters.
     */
    data: ChapterCreateManyInput | ChapterCreateManyInput[]
  }

  /**
   * Chapter createManyAndReturn
   */
  export type ChapterCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Chapter
     */
    select?: ChapterSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Chapter
     */
    omit?: ChapterOmit<ExtArgs> | null
    /**
     * The data used to create many Chapters.
     */
    data: ChapterCreateManyInput | ChapterCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChapterIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Chapter update
   */
  export type ChapterUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Chapter
     */
    select?: ChapterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Chapter
     */
    omit?: ChapterOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChapterInclude<ExtArgs> | null
    /**
     * The data needed to update a Chapter.
     */
    data: XOR<ChapterUpdateInput, ChapterUncheckedUpdateInput>
    /**
     * Choose, which Chapter to update.
     */
    where: ChapterWhereUniqueInput
  }

  /**
   * Chapter updateMany
   */
  export type ChapterUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Chapters.
     */
    data: XOR<ChapterUpdateManyMutationInput, ChapterUncheckedUpdateManyInput>
    /**
     * Filter which Chapters to update
     */
    where?: ChapterWhereInput
    /**
     * Limit how many Chapters to update.
     */
    limit?: number
  }

  /**
   * Chapter updateManyAndReturn
   */
  export type ChapterUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Chapter
     */
    select?: ChapterSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Chapter
     */
    omit?: ChapterOmit<ExtArgs> | null
    /**
     * The data used to update Chapters.
     */
    data: XOR<ChapterUpdateManyMutationInput, ChapterUncheckedUpdateManyInput>
    /**
     * Filter which Chapters to update
     */
    where?: ChapterWhereInput
    /**
     * Limit how many Chapters to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChapterIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Chapter upsert
   */
  export type ChapterUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Chapter
     */
    select?: ChapterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Chapter
     */
    omit?: ChapterOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChapterInclude<ExtArgs> | null
    /**
     * The filter to search for the Chapter to update in case it exists.
     */
    where: ChapterWhereUniqueInput
    /**
     * In case the Chapter found by the `where` argument doesn't exist, create a new Chapter with this data.
     */
    create: XOR<ChapterCreateInput, ChapterUncheckedCreateInput>
    /**
     * In case the Chapter was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ChapterUpdateInput, ChapterUncheckedUpdateInput>
  }

  /**
   * Chapter delete
   */
  export type ChapterDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Chapter
     */
    select?: ChapterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Chapter
     */
    omit?: ChapterOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChapterInclude<ExtArgs> | null
    /**
     * Filter which Chapter to delete.
     */
    where: ChapterWhereUniqueInput
  }

  /**
   * Chapter deleteMany
   */
  export type ChapterDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Chapters to delete
     */
    where?: ChapterWhereInput
    /**
     * Limit how many Chapters to delete.
     */
    limit?: number
  }

  /**
   * Chapter.translations
   */
  export type Chapter$translationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChapterTranslation
     */
    select?: ChapterTranslationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ChapterTranslation
     */
    omit?: ChapterTranslationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChapterTranslationInclude<ExtArgs> | null
    where?: ChapterTranslationWhereInput
    orderBy?: ChapterTranslationOrderByWithRelationInput | ChapterTranslationOrderByWithRelationInput[]
    cursor?: ChapterTranslationWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ChapterTranslationScalarFieldEnum | ChapterTranslationScalarFieldEnum[]
  }

  /**
   * Chapter without action
   */
  export type ChapterDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Chapter
     */
    select?: ChapterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Chapter
     */
    omit?: ChapterOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChapterInclude<ExtArgs> | null
  }


  /**
   * Model SyncRun
   */

  export type AggregateSyncRun = {
    _count: SyncRunCountAggregateOutputType | null
    _avg: SyncRunAvgAggregateOutputType | null
    _sum: SyncRunSumAggregateOutputType | null
    _min: SyncRunMinAggregateOutputType | null
    _max: SyncRunMaxAggregateOutputType | null
  }

  export type SyncRunAvgAggregateOutputType = {
    totalFound: number | null
    newChapters: number | null
  }

  export type SyncRunSumAggregateOutputType = {
    totalFound: number | null
    newChapters: number | null
  }

  export type SyncRunMinAggregateOutputType = {
    id: string | null
    novelId: string | null
    triggerType: string | null
    status: string | null
    totalFound: number | null
    newChapters: number | null
    errorMessage: string | null
    startedAt: Date | null
    endedAt: Date | null
    createdAt: Date | null
  }

  export type SyncRunMaxAggregateOutputType = {
    id: string | null
    novelId: string | null
    triggerType: string | null
    status: string | null
    totalFound: number | null
    newChapters: number | null
    errorMessage: string | null
    startedAt: Date | null
    endedAt: Date | null
    createdAt: Date | null
  }

  export type SyncRunCountAggregateOutputType = {
    id: number
    novelId: number
    triggerType: number
    status: number
    totalFound: number
    newChapters: number
    errorMessage: number
    startedAt: number
    endedAt: number
    createdAt: number
    _all: number
  }


  export type SyncRunAvgAggregateInputType = {
    totalFound?: true
    newChapters?: true
  }

  export type SyncRunSumAggregateInputType = {
    totalFound?: true
    newChapters?: true
  }

  export type SyncRunMinAggregateInputType = {
    id?: true
    novelId?: true
    triggerType?: true
    status?: true
    totalFound?: true
    newChapters?: true
    errorMessage?: true
    startedAt?: true
    endedAt?: true
    createdAt?: true
  }

  export type SyncRunMaxAggregateInputType = {
    id?: true
    novelId?: true
    triggerType?: true
    status?: true
    totalFound?: true
    newChapters?: true
    errorMessage?: true
    startedAt?: true
    endedAt?: true
    createdAt?: true
  }

  export type SyncRunCountAggregateInputType = {
    id?: true
    novelId?: true
    triggerType?: true
    status?: true
    totalFound?: true
    newChapters?: true
    errorMessage?: true
    startedAt?: true
    endedAt?: true
    createdAt?: true
    _all?: true
  }

  export type SyncRunAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SyncRun to aggregate.
     */
    where?: SyncRunWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SyncRuns to fetch.
     */
    orderBy?: SyncRunOrderByWithRelationInput | SyncRunOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SyncRunWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SyncRuns from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SyncRuns.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned SyncRuns
    **/
    _count?: true | SyncRunCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: SyncRunAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: SyncRunSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SyncRunMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SyncRunMaxAggregateInputType
  }

  export type GetSyncRunAggregateType<T extends SyncRunAggregateArgs> = {
        [P in keyof T & keyof AggregateSyncRun]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSyncRun[P]>
      : GetScalarType<T[P], AggregateSyncRun[P]>
  }




  export type SyncRunGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SyncRunWhereInput
    orderBy?: SyncRunOrderByWithAggregationInput | SyncRunOrderByWithAggregationInput[]
    by: SyncRunScalarFieldEnum[] | SyncRunScalarFieldEnum
    having?: SyncRunScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SyncRunCountAggregateInputType | true
    _avg?: SyncRunAvgAggregateInputType
    _sum?: SyncRunSumAggregateInputType
    _min?: SyncRunMinAggregateInputType
    _max?: SyncRunMaxAggregateInputType
  }

  export type SyncRunGroupByOutputType = {
    id: string
    novelId: string
    triggerType: string
    status: string
    totalFound: number
    newChapters: number
    errorMessage: string | null
    startedAt: Date | null
    endedAt: Date | null
    createdAt: Date
    _count: SyncRunCountAggregateOutputType | null
    _avg: SyncRunAvgAggregateOutputType | null
    _sum: SyncRunSumAggregateOutputType | null
    _min: SyncRunMinAggregateOutputType | null
    _max: SyncRunMaxAggregateOutputType | null
  }

  type GetSyncRunGroupByPayload<T extends SyncRunGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SyncRunGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SyncRunGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SyncRunGroupByOutputType[P]>
            : GetScalarType<T[P], SyncRunGroupByOutputType[P]>
        }
      >
    >


  export type SyncRunSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    novelId?: boolean
    triggerType?: boolean
    status?: boolean
    totalFound?: boolean
    newChapters?: boolean
    errorMessage?: boolean
    startedAt?: boolean
    endedAt?: boolean
    createdAt?: boolean
    novel?: boolean | NovelDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["syncRun"]>

  export type SyncRunSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    novelId?: boolean
    triggerType?: boolean
    status?: boolean
    totalFound?: boolean
    newChapters?: boolean
    errorMessage?: boolean
    startedAt?: boolean
    endedAt?: boolean
    createdAt?: boolean
    novel?: boolean | NovelDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["syncRun"]>

  export type SyncRunSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    novelId?: boolean
    triggerType?: boolean
    status?: boolean
    totalFound?: boolean
    newChapters?: boolean
    errorMessage?: boolean
    startedAt?: boolean
    endedAt?: boolean
    createdAt?: boolean
    novel?: boolean | NovelDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["syncRun"]>

  export type SyncRunSelectScalar = {
    id?: boolean
    novelId?: boolean
    triggerType?: boolean
    status?: boolean
    totalFound?: boolean
    newChapters?: boolean
    errorMessage?: boolean
    startedAt?: boolean
    endedAt?: boolean
    createdAt?: boolean
  }

  export type SyncRunOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "novelId" | "triggerType" | "status" | "totalFound" | "newChapters" | "errorMessage" | "startedAt" | "endedAt" | "createdAt", ExtArgs["result"]["syncRun"]>
  export type SyncRunInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    novel?: boolean | NovelDefaultArgs<ExtArgs>
  }
  export type SyncRunIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    novel?: boolean | NovelDefaultArgs<ExtArgs>
  }
  export type SyncRunIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    novel?: boolean | NovelDefaultArgs<ExtArgs>
  }

  export type $SyncRunPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "SyncRun"
    objects: {
      novel: Prisma.$NovelPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      novelId: string
      triggerType: string
      status: string
      totalFound: number
      newChapters: number
      errorMessage: string | null
      startedAt: Date | null
      endedAt: Date | null
      createdAt: Date
    }, ExtArgs["result"]["syncRun"]>
    composites: {}
  }

  type SyncRunGetPayload<S extends boolean | null | undefined | SyncRunDefaultArgs> = $Result.GetResult<Prisma.$SyncRunPayload, S>

  type SyncRunCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<SyncRunFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: SyncRunCountAggregateInputType | true
    }

  export interface SyncRunDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['SyncRun'], meta: { name: 'SyncRun' } }
    /**
     * Find zero or one SyncRun that matches the filter.
     * @param {SyncRunFindUniqueArgs} args - Arguments to find a SyncRun
     * @example
     * // Get one SyncRun
     * const syncRun = await prisma.syncRun.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SyncRunFindUniqueArgs>(args: SelectSubset<T, SyncRunFindUniqueArgs<ExtArgs>>): Prisma__SyncRunClient<$Result.GetResult<Prisma.$SyncRunPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one SyncRun that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {SyncRunFindUniqueOrThrowArgs} args - Arguments to find a SyncRun
     * @example
     * // Get one SyncRun
     * const syncRun = await prisma.syncRun.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SyncRunFindUniqueOrThrowArgs>(args: SelectSubset<T, SyncRunFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SyncRunClient<$Result.GetResult<Prisma.$SyncRunPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first SyncRun that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SyncRunFindFirstArgs} args - Arguments to find a SyncRun
     * @example
     * // Get one SyncRun
     * const syncRun = await prisma.syncRun.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SyncRunFindFirstArgs>(args?: SelectSubset<T, SyncRunFindFirstArgs<ExtArgs>>): Prisma__SyncRunClient<$Result.GetResult<Prisma.$SyncRunPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first SyncRun that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SyncRunFindFirstOrThrowArgs} args - Arguments to find a SyncRun
     * @example
     * // Get one SyncRun
     * const syncRun = await prisma.syncRun.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SyncRunFindFirstOrThrowArgs>(args?: SelectSubset<T, SyncRunFindFirstOrThrowArgs<ExtArgs>>): Prisma__SyncRunClient<$Result.GetResult<Prisma.$SyncRunPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more SyncRuns that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SyncRunFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all SyncRuns
     * const syncRuns = await prisma.syncRun.findMany()
     * 
     * // Get first 10 SyncRuns
     * const syncRuns = await prisma.syncRun.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const syncRunWithIdOnly = await prisma.syncRun.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends SyncRunFindManyArgs>(args?: SelectSubset<T, SyncRunFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SyncRunPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a SyncRun.
     * @param {SyncRunCreateArgs} args - Arguments to create a SyncRun.
     * @example
     * // Create one SyncRun
     * const SyncRun = await prisma.syncRun.create({
     *   data: {
     *     // ... data to create a SyncRun
     *   }
     * })
     * 
     */
    create<T extends SyncRunCreateArgs>(args: SelectSubset<T, SyncRunCreateArgs<ExtArgs>>): Prisma__SyncRunClient<$Result.GetResult<Prisma.$SyncRunPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many SyncRuns.
     * @param {SyncRunCreateManyArgs} args - Arguments to create many SyncRuns.
     * @example
     * // Create many SyncRuns
     * const syncRun = await prisma.syncRun.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SyncRunCreateManyArgs>(args?: SelectSubset<T, SyncRunCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many SyncRuns and returns the data saved in the database.
     * @param {SyncRunCreateManyAndReturnArgs} args - Arguments to create many SyncRuns.
     * @example
     * // Create many SyncRuns
     * const syncRun = await prisma.syncRun.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many SyncRuns and only return the `id`
     * const syncRunWithIdOnly = await prisma.syncRun.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SyncRunCreateManyAndReturnArgs>(args?: SelectSubset<T, SyncRunCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SyncRunPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a SyncRun.
     * @param {SyncRunDeleteArgs} args - Arguments to delete one SyncRun.
     * @example
     * // Delete one SyncRun
     * const SyncRun = await prisma.syncRun.delete({
     *   where: {
     *     // ... filter to delete one SyncRun
     *   }
     * })
     * 
     */
    delete<T extends SyncRunDeleteArgs>(args: SelectSubset<T, SyncRunDeleteArgs<ExtArgs>>): Prisma__SyncRunClient<$Result.GetResult<Prisma.$SyncRunPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one SyncRun.
     * @param {SyncRunUpdateArgs} args - Arguments to update one SyncRun.
     * @example
     * // Update one SyncRun
     * const syncRun = await prisma.syncRun.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SyncRunUpdateArgs>(args: SelectSubset<T, SyncRunUpdateArgs<ExtArgs>>): Prisma__SyncRunClient<$Result.GetResult<Prisma.$SyncRunPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more SyncRuns.
     * @param {SyncRunDeleteManyArgs} args - Arguments to filter SyncRuns to delete.
     * @example
     * // Delete a few SyncRuns
     * const { count } = await prisma.syncRun.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SyncRunDeleteManyArgs>(args?: SelectSubset<T, SyncRunDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SyncRuns.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SyncRunUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many SyncRuns
     * const syncRun = await prisma.syncRun.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SyncRunUpdateManyArgs>(args: SelectSubset<T, SyncRunUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SyncRuns and returns the data updated in the database.
     * @param {SyncRunUpdateManyAndReturnArgs} args - Arguments to update many SyncRuns.
     * @example
     * // Update many SyncRuns
     * const syncRun = await prisma.syncRun.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more SyncRuns and only return the `id`
     * const syncRunWithIdOnly = await prisma.syncRun.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends SyncRunUpdateManyAndReturnArgs>(args: SelectSubset<T, SyncRunUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SyncRunPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one SyncRun.
     * @param {SyncRunUpsertArgs} args - Arguments to update or create a SyncRun.
     * @example
     * // Update or create a SyncRun
     * const syncRun = await prisma.syncRun.upsert({
     *   create: {
     *     // ... data to create a SyncRun
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the SyncRun we want to update
     *   }
     * })
     */
    upsert<T extends SyncRunUpsertArgs>(args: SelectSubset<T, SyncRunUpsertArgs<ExtArgs>>): Prisma__SyncRunClient<$Result.GetResult<Prisma.$SyncRunPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of SyncRuns.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SyncRunCountArgs} args - Arguments to filter SyncRuns to count.
     * @example
     * // Count the number of SyncRuns
     * const count = await prisma.syncRun.count({
     *   where: {
     *     // ... the filter for the SyncRuns we want to count
     *   }
     * })
    **/
    count<T extends SyncRunCountArgs>(
      args?: Subset<T, SyncRunCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SyncRunCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a SyncRun.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SyncRunAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SyncRunAggregateArgs>(args: Subset<T, SyncRunAggregateArgs>): Prisma.PrismaPromise<GetSyncRunAggregateType<T>>

    /**
     * Group by SyncRun.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SyncRunGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends SyncRunGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SyncRunGroupByArgs['orderBy'] }
        : { orderBy?: SyncRunGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SyncRunGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSyncRunGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the SyncRun model
   */
  readonly fields: SyncRunFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for SyncRun.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SyncRunClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    novel<T extends NovelDefaultArgs<ExtArgs> = {}>(args?: Subset<T, NovelDefaultArgs<ExtArgs>>): Prisma__NovelClient<$Result.GetResult<Prisma.$NovelPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the SyncRun model
   */
  interface SyncRunFieldRefs {
    readonly id: FieldRef<"SyncRun", 'String'>
    readonly novelId: FieldRef<"SyncRun", 'String'>
    readonly triggerType: FieldRef<"SyncRun", 'String'>
    readonly status: FieldRef<"SyncRun", 'String'>
    readonly totalFound: FieldRef<"SyncRun", 'Int'>
    readonly newChapters: FieldRef<"SyncRun", 'Int'>
    readonly errorMessage: FieldRef<"SyncRun", 'String'>
    readonly startedAt: FieldRef<"SyncRun", 'DateTime'>
    readonly endedAt: FieldRef<"SyncRun", 'DateTime'>
    readonly createdAt: FieldRef<"SyncRun", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * SyncRun findUnique
   */
  export type SyncRunFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SyncRun
     */
    select?: SyncRunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SyncRun
     */
    omit?: SyncRunOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SyncRunInclude<ExtArgs> | null
    /**
     * Filter, which SyncRun to fetch.
     */
    where: SyncRunWhereUniqueInput
  }

  /**
   * SyncRun findUniqueOrThrow
   */
  export type SyncRunFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SyncRun
     */
    select?: SyncRunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SyncRun
     */
    omit?: SyncRunOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SyncRunInclude<ExtArgs> | null
    /**
     * Filter, which SyncRun to fetch.
     */
    where: SyncRunWhereUniqueInput
  }

  /**
   * SyncRun findFirst
   */
  export type SyncRunFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SyncRun
     */
    select?: SyncRunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SyncRun
     */
    omit?: SyncRunOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SyncRunInclude<ExtArgs> | null
    /**
     * Filter, which SyncRun to fetch.
     */
    where?: SyncRunWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SyncRuns to fetch.
     */
    orderBy?: SyncRunOrderByWithRelationInput | SyncRunOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SyncRuns.
     */
    cursor?: SyncRunWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SyncRuns from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SyncRuns.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SyncRuns.
     */
    distinct?: SyncRunScalarFieldEnum | SyncRunScalarFieldEnum[]
  }

  /**
   * SyncRun findFirstOrThrow
   */
  export type SyncRunFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SyncRun
     */
    select?: SyncRunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SyncRun
     */
    omit?: SyncRunOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SyncRunInclude<ExtArgs> | null
    /**
     * Filter, which SyncRun to fetch.
     */
    where?: SyncRunWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SyncRuns to fetch.
     */
    orderBy?: SyncRunOrderByWithRelationInput | SyncRunOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SyncRuns.
     */
    cursor?: SyncRunWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SyncRuns from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SyncRuns.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SyncRuns.
     */
    distinct?: SyncRunScalarFieldEnum | SyncRunScalarFieldEnum[]
  }

  /**
   * SyncRun findMany
   */
  export type SyncRunFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SyncRun
     */
    select?: SyncRunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SyncRun
     */
    omit?: SyncRunOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SyncRunInclude<ExtArgs> | null
    /**
     * Filter, which SyncRuns to fetch.
     */
    where?: SyncRunWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SyncRuns to fetch.
     */
    orderBy?: SyncRunOrderByWithRelationInput | SyncRunOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing SyncRuns.
     */
    cursor?: SyncRunWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SyncRuns from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SyncRuns.
     */
    skip?: number
    distinct?: SyncRunScalarFieldEnum | SyncRunScalarFieldEnum[]
  }

  /**
   * SyncRun create
   */
  export type SyncRunCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SyncRun
     */
    select?: SyncRunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SyncRun
     */
    omit?: SyncRunOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SyncRunInclude<ExtArgs> | null
    /**
     * The data needed to create a SyncRun.
     */
    data: XOR<SyncRunCreateInput, SyncRunUncheckedCreateInput>
  }

  /**
   * SyncRun createMany
   */
  export type SyncRunCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many SyncRuns.
     */
    data: SyncRunCreateManyInput | SyncRunCreateManyInput[]
  }

  /**
   * SyncRun createManyAndReturn
   */
  export type SyncRunCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SyncRun
     */
    select?: SyncRunSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SyncRun
     */
    omit?: SyncRunOmit<ExtArgs> | null
    /**
     * The data used to create many SyncRuns.
     */
    data: SyncRunCreateManyInput | SyncRunCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SyncRunIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * SyncRun update
   */
  export type SyncRunUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SyncRun
     */
    select?: SyncRunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SyncRun
     */
    omit?: SyncRunOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SyncRunInclude<ExtArgs> | null
    /**
     * The data needed to update a SyncRun.
     */
    data: XOR<SyncRunUpdateInput, SyncRunUncheckedUpdateInput>
    /**
     * Choose, which SyncRun to update.
     */
    where: SyncRunWhereUniqueInput
  }

  /**
   * SyncRun updateMany
   */
  export type SyncRunUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update SyncRuns.
     */
    data: XOR<SyncRunUpdateManyMutationInput, SyncRunUncheckedUpdateManyInput>
    /**
     * Filter which SyncRuns to update
     */
    where?: SyncRunWhereInput
    /**
     * Limit how many SyncRuns to update.
     */
    limit?: number
  }

  /**
   * SyncRun updateManyAndReturn
   */
  export type SyncRunUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SyncRun
     */
    select?: SyncRunSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SyncRun
     */
    omit?: SyncRunOmit<ExtArgs> | null
    /**
     * The data used to update SyncRuns.
     */
    data: XOR<SyncRunUpdateManyMutationInput, SyncRunUncheckedUpdateManyInput>
    /**
     * Filter which SyncRuns to update
     */
    where?: SyncRunWhereInput
    /**
     * Limit how many SyncRuns to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SyncRunIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * SyncRun upsert
   */
  export type SyncRunUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SyncRun
     */
    select?: SyncRunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SyncRun
     */
    omit?: SyncRunOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SyncRunInclude<ExtArgs> | null
    /**
     * The filter to search for the SyncRun to update in case it exists.
     */
    where: SyncRunWhereUniqueInput
    /**
     * In case the SyncRun found by the `where` argument doesn't exist, create a new SyncRun with this data.
     */
    create: XOR<SyncRunCreateInput, SyncRunUncheckedCreateInput>
    /**
     * In case the SyncRun was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SyncRunUpdateInput, SyncRunUncheckedUpdateInput>
  }

  /**
   * SyncRun delete
   */
  export type SyncRunDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SyncRun
     */
    select?: SyncRunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SyncRun
     */
    omit?: SyncRunOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SyncRunInclude<ExtArgs> | null
    /**
     * Filter which SyncRun to delete.
     */
    where: SyncRunWhereUniqueInput
  }

  /**
   * SyncRun deleteMany
   */
  export type SyncRunDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SyncRuns to delete
     */
    where?: SyncRunWhereInput
    /**
     * Limit how many SyncRuns to delete.
     */
    limit?: number
  }

  /**
   * SyncRun without action
   */
  export type SyncRunDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SyncRun
     */
    select?: SyncRunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SyncRun
     */
    omit?: SyncRunOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SyncRunInclude<ExtArgs> | null
  }


  /**
   * Model TranslationProject
   */

  export type AggregateTranslationProject = {
    _count: TranslationProjectCountAggregateOutputType | null
    _avg: TranslationProjectAvgAggregateOutputType | null
    _sum: TranslationProjectSumAggregateOutputType | null
    _min: TranslationProjectMinAggregateOutputType | null
    _max: TranslationProjectMaxAggregateOutputType | null
  }

  export type TranslationProjectAvgAggregateOutputType = {
    historyDepth: number | null
    chapterConcurrency: number | null
  }

  export type TranslationProjectSumAggregateOutputType = {
    historyDepth: number | null
    chapterConcurrency: number | null
  }

  export type TranslationProjectMinAggregateOutputType = {
    id: string | null
    novelId: string | null
    name: string | null
    targetLanguage: string | null
    provider: string | null
    model: string | null
    systemPrompt: string | null
    styleGuideJson: string | null
    contextMode: string | null
    historyDepth: number | null
    autoTranslateNewChapters: boolean | null
    chapterConcurrency: number | null
    isActiveAuto: boolean | null
    isDefaultEdition: boolean | null
    status: string | null
    lastError: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type TranslationProjectMaxAggregateOutputType = {
    id: string | null
    novelId: string | null
    name: string | null
    targetLanguage: string | null
    provider: string | null
    model: string | null
    systemPrompt: string | null
    styleGuideJson: string | null
    contextMode: string | null
    historyDepth: number | null
    autoTranslateNewChapters: boolean | null
    chapterConcurrency: number | null
    isActiveAuto: boolean | null
    isDefaultEdition: boolean | null
    status: string | null
    lastError: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type TranslationProjectCountAggregateOutputType = {
    id: number
    novelId: number
    name: number
    targetLanguage: number
    provider: number
    model: number
    systemPrompt: number
    styleGuideJson: number
    contextMode: number
    historyDepth: number
    autoTranslateNewChapters: number
    chapterConcurrency: number
    isActiveAuto: number
    isDefaultEdition: number
    status: number
    lastError: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type TranslationProjectAvgAggregateInputType = {
    historyDepth?: true
    chapterConcurrency?: true
  }

  export type TranslationProjectSumAggregateInputType = {
    historyDepth?: true
    chapterConcurrency?: true
  }

  export type TranslationProjectMinAggregateInputType = {
    id?: true
    novelId?: true
    name?: true
    targetLanguage?: true
    provider?: true
    model?: true
    systemPrompt?: true
    styleGuideJson?: true
    contextMode?: true
    historyDepth?: true
    autoTranslateNewChapters?: true
    chapterConcurrency?: true
    isActiveAuto?: true
    isDefaultEdition?: true
    status?: true
    lastError?: true
    createdAt?: true
    updatedAt?: true
  }

  export type TranslationProjectMaxAggregateInputType = {
    id?: true
    novelId?: true
    name?: true
    targetLanguage?: true
    provider?: true
    model?: true
    systemPrompt?: true
    styleGuideJson?: true
    contextMode?: true
    historyDepth?: true
    autoTranslateNewChapters?: true
    chapterConcurrency?: true
    isActiveAuto?: true
    isDefaultEdition?: true
    status?: true
    lastError?: true
    createdAt?: true
    updatedAt?: true
  }

  export type TranslationProjectCountAggregateInputType = {
    id?: true
    novelId?: true
    name?: true
    targetLanguage?: true
    provider?: true
    model?: true
    systemPrompt?: true
    styleGuideJson?: true
    contextMode?: true
    historyDepth?: true
    autoTranslateNewChapters?: true
    chapterConcurrency?: true
    isActiveAuto?: true
    isDefaultEdition?: true
    status?: true
    lastError?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type TranslationProjectAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TranslationProject to aggregate.
     */
    where?: TranslationProjectWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TranslationProjects to fetch.
     */
    orderBy?: TranslationProjectOrderByWithRelationInput | TranslationProjectOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TranslationProjectWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TranslationProjects from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TranslationProjects.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned TranslationProjects
    **/
    _count?: true | TranslationProjectCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: TranslationProjectAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: TranslationProjectSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TranslationProjectMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TranslationProjectMaxAggregateInputType
  }

  export type GetTranslationProjectAggregateType<T extends TranslationProjectAggregateArgs> = {
        [P in keyof T & keyof AggregateTranslationProject]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTranslationProject[P]>
      : GetScalarType<T[P], AggregateTranslationProject[P]>
  }




  export type TranslationProjectGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TranslationProjectWhereInput
    orderBy?: TranslationProjectOrderByWithAggregationInput | TranslationProjectOrderByWithAggregationInput[]
    by: TranslationProjectScalarFieldEnum[] | TranslationProjectScalarFieldEnum
    having?: TranslationProjectScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TranslationProjectCountAggregateInputType | true
    _avg?: TranslationProjectAvgAggregateInputType
    _sum?: TranslationProjectSumAggregateInputType
    _min?: TranslationProjectMinAggregateInputType
    _max?: TranslationProjectMaxAggregateInputType
  }

  export type TranslationProjectGroupByOutputType = {
    id: string
    novelId: string
    name: string
    targetLanguage: string
    provider: string
    model: string
    systemPrompt: string | null
    styleGuideJson: string
    contextMode: string
    historyDepth: number
    autoTranslateNewChapters: boolean
    chapterConcurrency: number
    isActiveAuto: boolean
    isDefaultEdition: boolean
    status: string
    lastError: string | null
    createdAt: Date
    updatedAt: Date
    _count: TranslationProjectCountAggregateOutputType | null
    _avg: TranslationProjectAvgAggregateOutputType | null
    _sum: TranslationProjectSumAggregateOutputType | null
    _min: TranslationProjectMinAggregateOutputType | null
    _max: TranslationProjectMaxAggregateOutputType | null
  }

  type GetTranslationProjectGroupByPayload<T extends TranslationProjectGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TranslationProjectGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TranslationProjectGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TranslationProjectGroupByOutputType[P]>
            : GetScalarType<T[P], TranslationProjectGroupByOutputType[P]>
        }
      >
    >


  export type TranslationProjectSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    novelId?: boolean
    name?: boolean
    targetLanguage?: boolean
    provider?: boolean
    model?: boolean
    systemPrompt?: boolean
    styleGuideJson?: boolean
    contextMode?: boolean
    historyDepth?: boolean
    autoTranslateNewChapters?: boolean
    chapterConcurrency?: boolean
    isActiveAuto?: boolean
    isDefaultEdition?: boolean
    status?: boolean
    lastError?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    novel?: boolean | NovelDefaultArgs<ExtArgs>
    glossaries?: boolean | TranslationProject$glossariesArgs<ExtArgs>
    chapterTranslations?: boolean | TranslationProject$chapterTranslationsArgs<ExtArgs>
    runs?: boolean | TranslationProject$runsArgs<ExtArgs>
    _count?: boolean | TranslationProjectCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["translationProject"]>

  export type TranslationProjectSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    novelId?: boolean
    name?: boolean
    targetLanguage?: boolean
    provider?: boolean
    model?: boolean
    systemPrompt?: boolean
    styleGuideJson?: boolean
    contextMode?: boolean
    historyDepth?: boolean
    autoTranslateNewChapters?: boolean
    chapterConcurrency?: boolean
    isActiveAuto?: boolean
    isDefaultEdition?: boolean
    status?: boolean
    lastError?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    novel?: boolean | NovelDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["translationProject"]>

  export type TranslationProjectSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    novelId?: boolean
    name?: boolean
    targetLanguage?: boolean
    provider?: boolean
    model?: boolean
    systemPrompt?: boolean
    styleGuideJson?: boolean
    contextMode?: boolean
    historyDepth?: boolean
    autoTranslateNewChapters?: boolean
    chapterConcurrency?: boolean
    isActiveAuto?: boolean
    isDefaultEdition?: boolean
    status?: boolean
    lastError?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    novel?: boolean | NovelDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["translationProject"]>

  export type TranslationProjectSelectScalar = {
    id?: boolean
    novelId?: boolean
    name?: boolean
    targetLanguage?: boolean
    provider?: boolean
    model?: boolean
    systemPrompt?: boolean
    styleGuideJson?: boolean
    contextMode?: boolean
    historyDepth?: boolean
    autoTranslateNewChapters?: boolean
    chapterConcurrency?: boolean
    isActiveAuto?: boolean
    isDefaultEdition?: boolean
    status?: boolean
    lastError?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type TranslationProjectOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "novelId" | "name" | "targetLanguage" | "provider" | "model" | "systemPrompt" | "styleGuideJson" | "contextMode" | "historyDepth" | "autoTranslateNewChapters" | "chapterConcurrency" | "isActiveAuto" | "isDefaultEdition" | "status" | "lastError" | "createdAt" | "updatedAt", ExtArgs["result"]["translationProject"]>
  export type TranslationProjectInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    novel?: boolean | NovelDefaultArgs<ExtArgs>
    glossaries?: boolean | TranslationProject$glossariesArgs<ExtArgs>
    chapterTranslations?: boolean | TranslationProject$chapterTranslationsArgs<ExtArgs>
    runs?: boolean | TranslationProject$runsArgs<ExtArgs>
    _count?: boolean | TranslationProjectCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type TranslationProjectIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    novel?: boolean | NovelDefaultArgs<ExtArgs>
  }
  export type TranslationProjectIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    novel?: boolean | NovelDefaultArgs<ExtArgs>
  }

  export type $TranslationProjectPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "TranslationProject"
    objects: {
      novel: Prisma.$NovelPayload<ExtArgs>
      glossaries: Prisma.$TranslationGlossaryPayload<ExtArgs>[]
      chapterTranslations: Prisma.$ChapterTranslationPayload<ExtArgs>[]
      runs: Prisma.$TranslationRunPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      novelId: string
      name: string
      targetLanguage: string
      provider: string
      model: string
      systemPrompt: string | null
      styleGuideJson: string
      contextMode: string
      historyDepth: number
      autoTranslateNewChapters: boolean
      chapterConcurrency: number
      isActiveAuto: boolean
      isDefaultEdition: boolean
      status: string
      lastError: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["translationProject"]>
    composites: {}
  }

  type TranslationProjectGetPayload<S extends boolean | null | undefined | TranslationProjectDefaultArgs> = $Result.GetResult<Prisma.$TranslationProjectPayload, S>

  type TranslationProjectCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<TranslationProjectFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: TranslationProjectCountAggregateInputType | true
    }

  export interface TranslationProjectDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['TranslationProject'], meta: { name: 'TranslationProject' } }
    /**
     * Find zero or one TranslationProject that matches the filter.
     * @param {TranslationProjectFindUniqueArgs} args - Arguments to find a TranslationProject
     * @example
     * // Get one TranslationProject
     * const translationProject = await prisma.translationProject.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TranslationProjectFindUniqueArgs>(args: SelectSubset<T, TranslationProjectFindUniqueArgs<ExtArgs>>): Prisma__TranslationProjectClient<$Result.GetResult<Prisma.$TranslationProjectPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one TranslationProject that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {TranslationProjectFindUniqueOrThrowArgs} args - Arguments to find a TranslationProject
     * @example
     * // Get one TranslationProject
     * const translationProject = await prisma.translationProject.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TranslationProjectFindUniqueOrThrowArgs>(args: SelectSubset<T, TranslationProjectFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TranslationProjectClient<$Result.GetResult<Prisma.$TranslationProjectPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first TranslationProject that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TranslationProjectFindFirstArgs} args - Arguments to find a TranslationProject
     * @example
     * // Get one TranslationProject
     * const translationProject = await prisma.translationProject.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TranslationProjectFindFirstArgs>(args?: SelectSubset<T, TranslationProjectFindFirstArgs<ExtArgs>>): Prisma__TranslationProjectClient<$Result.GetResult<Prisma.$TranslationProjectPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first TranslationProject that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TranslationProjectFindFirstOrThrowArgs} args - Arguments to find a TranslationProject
     * @example
     * // Get one TranslationProject
     * const translationProject = await prisma.translationProject.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TranslationProjectFindFirstOrThrowArgs>(args?: SelectSubset<T, TranslationProjectFindFirstOrThrowArgs<ExtArgs>>): Prisma__TranslationProjectClient<$Result.GetResult<Prisma.$TranslationProjectPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more TranslationProjects that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TranslationProjectFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all TranslationProjects
     * const translationProjects = await prisma.translationProject.findMany()
     * 
     * // Get first 10 TranslationProjects
     * const translationProjects = await prisma.translationProject.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const translationProjectWithIdOnly = await prisma.translationProject.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends TranslationProjectFindManyArgs>(args?: SelectSubset<T, TranslationProjectFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TranslationProjectPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a TranslationProject.
     * @param {TranslationProjectCreateArgs} args - Arguments to create a TranslationProject.
     * @example
     * // Create one TranslationProject
     * const TranslationProject = await prisma.translationProject.create({
     *   data: {
     *     // ... data to create a TranslationProject
     *   }
     * })
     * 
     */
    create<T extends TranslationProjectCreateArgs>(args: SelectSubset<T, TranslationProjectCreateArgs<ExtArgs>>): Prisma__TranslationProjectClient<$Result.GetResult<Prisma.$TranslationProjectPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many TranslationProjects.
     * @param {TranslationProjectCreateManyArgs} args - Arguments to create many TranslationProjects.
     * @example
     * // Create many TranslationProjects
     * const translationProject = await prisma.translationProject.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TranslationProjectCreateManyArgs>(args?: SelectSubset<T, TranslationProjectCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many TranslationProjects and returns the data saved in the database.
     * @param {TranslationProjectCreateManyAndReturnArgs} args - Arguments to create many TranslationProjects.
     * @example
     * // Create many TranslationProjects
     * const translationProject = await prisma.translationProject.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many TranslationProjects and only return the `id`
     * const translationProjectWithIdOnly = await prisma.translationProject.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends TranslationProjectCreateManyAndReturnArgs>(args?: SelectSubset<T, TranslationProjectCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TranslationProjectPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a TranslationProject.
     * @param {TranslationProjectDeleteArgs} args - Arguments to delete one TranslationProject.
     * @example
     * // Delete one TranslationProject
     * const TranslationProject = await prisma.translationProject.delete({
     *   where: {
     *     // ... filter to delete one TranslationProject
     *   }
     * })
     * 
     */
    delete<T extends TranslationProjectDeleteArgs>(args: SelectSubset<T, TranslationProjectDeleteArgs<ExtArgs>>): Prisma__TranslationProjectClient<$Result.GetResult<Prisma.$TranslationProjectPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one TranslationProject.
     * @param {TranslationProjectUpdateArgs} args - Arguments to update one TranslationProject.
     * @example
     * // Update one TranslationProject
     * const translationProject = await prisma.translationProject.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TranslationProjectUpdateArgs>(args: SelectSubset<T, TranslationProjectUpdateArgs<ExtArgs>>): Prisma__TranslationProjectClient<$Result.GetResult<Prisma.$TranslationProjectPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more TranslationProjects.
     * @param {TranslationProjectDeleteManyArgs} args - Arguments to filter TranslationProjects to delete.
     * @example
     * // Delete a few TranslationProjects
     * const { count } = await prisma.translationProject.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TranslationProjectDeleteManyArgs>(args?: SelectSubset<T, TranslationProjectDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more TranslationProjects.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TranslationProjectUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many TranslationProjects
     * const translationProject = await prisma.translationProject.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TranslationProjectUpdateManyArgs>(args: SelectSubset<T, TranslationProjectUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more TranslationProjects and returns the data updated in the database.
     * @param {TranslationProjectUpdateManyAndReturnArgs} args - Arguments to update many TranslationProjects.
     * @example
     * // Update many TranslationProjects
     * const translationProject = await prisma.translationProject.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more TranslationProjects and only return the `id`
     * const translationProjectWithIdOnly = await prisma.translationProject.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends TranslationProjectUpdateManyAndReturnArgs>(args: SelectSubset<T, TranslationProjectUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TranslationProjectPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one TranslationProject.
     * @param {TranslationProjectUpsertArgs} args - Arguments to update or create a TranslationProject.
     * @example
     * // Update or create a TranslationProject
     * const translationProject = await prisma.translationProject.upsert({
     *   create: {
     *     // ... data to create a TranslationProject
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the TranslationProject we want to update
     *   }
     * })
     */
    upsert<T extends TranslationProjectUpsertArgs>(args: SelectSubset<T, TranslationProjectUpsertArgs<ExtArgs>>): Prisma__TranslationProjectClient<$Result.GetResult<Prisma.$TranslationProjectPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of TranslationProjects.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TranslationProjectCountArgs} args - Arguments to filter TranslationProjects to count.
     * @example
     * // Count the number of TranslationProjects
     * const count = await prisma.translationProject.count({
     *   where: {
     *     // ... the filter for the TranslationProjects we want to count
     *   }
     * })
    **/
    count<T extends TranslationProjectCountArgs>(
      args?: Subset<T, TranslationProjectCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TranslationProjectCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a TranslationProject.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TranslationProjectAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TranslationProjectAggregateArgs>(args: Subset<T, TranslationProjectAggregateArgs>): Prisma.PrismaPromise<GetTranslationProjectAggregateType<T>>

    /**
     * Group by TranslationProject.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TranslationProjectGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends TranslationProjectGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TranslationProjectGroupByArgs['orderBy'] }
        : { orderBy?: TranslationProjectGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, TranslationProjectGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTranslationProjectGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the TranslationProject model
   */
  readonly fields: TranslationProjectFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for TranslationProject.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TranslationProjectClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    novel<T extends NovelDefaultArgs<ExtArgs> = {}>(args?: Subset<T, NovelDefaultArgs<ExtArgs>>): Prisma__NovelClient<$Result.GetResult<Prisma.$NovelPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    glossaries<T extends TranslationProject$glossariesArgs<ExtArgs> = {}>(args?: Subset<T, TranslationProject$glossariesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TranslationGlossaryPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    chapterTranslations<T extends TranslationProject$chapterTranslationsArgs<ExtArgs> = {}>(args?: Subset<T, TranslationProject$chapterTranslationsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ChapterTranslationPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    runs<T extends TranslationProject$runsArgs<ExtArgs> = {}>(args?: Subset<T, TranslationProject$runsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TranslationRunPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the TranslationProject model
   */
  interface TranslationProjectFieldRefs {
    readonly id: FieldRef<"TranslationProject", 'String'>
    readonly novelId: FieldRef<"TranslationProject", 'String'>
    readonly name: FieldRef<"TranslationProject", 'String'>
    readonly targetLanguage: FieldRef<"TranslationProject", 'String'>
    readonly provider: FieldRef<"TranslationProject", 'String'>
    readonly model: FieldRef<"TranslationProject", 'String'>
    readonly systemPrompt: FieldRef<"TranslationProject", 'String'>
    readonly styleGuideJson: FieldRef<"TranslationProject", 'String'>
    readonly contextMode: FieldRef<"TranslationProject", 'String'>
    readonly historyDepth: FieldRef<"TranslationProject", 'Int'>
    readonly autoTranslateNewChapters: FieldRef<"TranslationProject", 'Boolean'>
    readonly chapterConcurrency: FieldRef<"TranslationProject", 'Int'>
    readonly isActiveAuto: FieldRef<"TranslationProject", 'Boolean'>
    readonly isDefaultEdition: FieldRef<"TranslationProject", 'Boolean'>
    readonly status: FieldRef<"TranslationProject", 'String'>
    readonly lastError: FieldRef<"TranslationProject", 'String'>
    readonly createdAt: FieldRef<"TranslationProject", 'DateTime'>
    readonly updatedAt: FieldRef<"TranslationProject", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * TranslationProject findUnique
   */
  export type TranslationProjectFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TranslationProject
     */
    select?: TranslationProjectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TranslationProject
     */
    omit?: TranslationProjectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TranslationProjectInclude<ExtArgs> | null
    /**
     * Filter, which TranslationProject to fetch.
     */
    where: TranslationProjectWhereUniqueInput
  }

  /**
   * TranslationProject findUniqueOrThrow
   */
  export type TranslationProjectFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TranslationProject
     */
    select?: TranslationProjectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TranslationProject
     */
    omit?: TranslationProjectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TranslationProjectInclude<ExtArgs> | null
    /**
     * Filter, which TranslationProject to fetch.
     */
    where: TranslationProjectWhereUniqueInput
  }

  /**
   * TranslationProject findFirst
   */
  export type TranslationProjectFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TranslationProject
     */
    select?: TranslationProjectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TranslationProject
     */
    omit?: TranslationProjectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TranslationProjectInclude<ExtArgs> | null
    /**
     * Filter, which TranslationProject to fetch.
     */
    where?: TranslationProjectWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TranslationProjects to fetch.
     */
    orderBy?: TranslationProjectOrderByWithRelationInput | TranslationProjectOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TranslationProjects.
     */
    cursor?: TranslationProjectWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TranslationProjects from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TranslationProjects.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TranslationProjects.
     */
    distinct?: TranslationProjectScalarFieldEnum | TranslationProjectScalarFieldEnum[]
  }

  /**
   * TranslationProject findFirstOrThrow
   */
  export type TranslationProjectFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TranslationProject
     */
    select?: TranslationProjectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TranslationProject
     */
    omit?: TranslationProjectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TranslationProjectInclude<ExtArgs> | null
    /**
     * Filter, which TranslationProject to fetch.
     */
    where?: TranslationProjectWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TranslationProjects to fetch.
     */
    orderBy?: TranslationProjectOrderByWithRelationInput | TranslationProjectOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TranslationProjects.
     */
    cursor?: TranslationProjectWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TranslationProjects from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TranslationProjects.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TranslationProjects.
     */
    distinct?: TranslationProjectScalarFieldEnum | TranslationProjectScalarFieldEnum[]
  }

  /**
   * TranslationProject findMany
   */
  export type TranslationProjectFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TranslationProject
     */
    select?: TranslationProjectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TranslationProject
     */
    omit?: TranslationProjectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TranslationProjectInclude<ExtArgs> | null
    /**
     * Filter, which TranslationProjects to fetch.
     */
    where?: TranslationProjectWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TranslationProjects to fetch.
     */
    orderBy?: TranslationProjectOrderByWithRelationInput | TranslationProjectOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing TranslationProjects.
     */
    cursor?: TranslationProjectWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TranslationProjects from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TranslationProjects.
     */
    skip?: number
    distinct?: TranslationProjectScalarFieldEnum | TranslationProjectScalarFieldEnum[]
  }

  /**
   * TranslationProject create
   */
  export type TranslationProjectCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TranslationProject
     */
    select?: TranslationProjectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TranslationProject
     */
    omit?: TranslationProjectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TranslationProjectInclude<ExtArgs> | null
    /**
     * The data needed to create a TranslationProject.
     */
    data: XOR<TranslationProjectCreateInput, TranslationProjectUncheckedCreateInput>
  }

  /**
   * TranslationProject createMany
   */
  export type TranslationProjectCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many TranslationProjects.
     */
    data: TranslationProjectCreateManyInput | TranslationProjectCreateManyInput[]
  }

  /**
   * TranslationProject createManyAndReturn
   */
  export type TranslationProjectCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TranslationProject
     */
    select?: TranslationProjectSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the TranslationProject
     */
    omit?: TranslationProjectOmit<ExtArgs> | null
    /**
     * The data used to create many TranslationProjects.
     */
    data: TranslationProjectCreateManyInput | TranslationProjectCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TranslationProjectIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * TranslationProject update
   */
  export type TranslationProjectUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TranslationProject
     */
    select?: TranslationProjectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TranslationProject
     */
    omit?: TranslationProjectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TranslationProjectInclude<ExtArgs> | null
    /**
     * The data needed to update a TranslationProject.
     */
    data: XOR<TranslationProjectUpdateInput, TranslationProjectUncheckedUpdateInput>
    /**
     * Choose, which TranslationProject to update.
     */
    where: TranslationProjectWhereUniqueInput
  }

  /**
   * TranslationProject updateMany
   */
  export type TranslationProjectUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update TranslationProjects.
     */
    data: XOR<TranslationProjectUpdateManyMutationInput, TranslationProjectUncheckedUpdateManyInput>
    /**
     * Filter which TranslationProjects to update
     */
    where?: TranslationProjectWhereInput
    /**
     * Limit how many TranslationProjects to update.
     */
    limit?: number
  }

  /**
   * TranslationProject updateManyAndReturn
   */
  export type TranslationProjectUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TranslationProject
     */
    select?: TranslationProjectSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the TranslationProject
     */
    omit?: TranslationProjectOmit<ExtArgs> | null
    /**
     * The data used to update TranslationProjects.
     */
    data: XOR<TranslationProjectUpdateManyMutationInput, TranslationProjectUncheckedUpdateManyInput>
    /**
     * Filter which TranslationProjects to update
     */
    where?: TranslationProjectWhereInput
    /**
     * Limit how many TranslationProjects to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TranslationProjectIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * TranslationProject upsert
   */
  export type TranslationProjectUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TranslationProject
     */
    select?: TranslationProjectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TranslationProject
     */
    omit?: TranslationProjectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TranslationProjectInclude<ExtArgs> | null
    /**
     * The filter to search for the TranslationProject to update in case it exists.
     */
    where: TranslationProjectWhereUniqueInput
    /**
     * In case the TranslationProject found by the `where` argument doesn't exist, create a new TranslationProject with this data.
     */
    create: XOR<TranslationProjectCreateInput, TranslationProjectUncheckedCreateInput>
    /**
     * In case the TranslationProject was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TranslationProjectUpdateInput, TranslationProjectUncheckedUpdateInput>
  }

  /**
   * TranslationProject delete
   */
  export type TranslationProjectDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TranslationProject
     */
    select?: TranslationProjectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TranslationProject
     */
    omit?: TranslationProjectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TranslationProjectInclude<ExtArgs> | null
    /**
     * Filter which TranslationProject to delete.
     */
    where: TranslationProjectWhereUniqueInput
  }

  /**
   * TranslationProject deleteMany
   */
  export type TranslationProjectDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TranslationProjects to delete
     */
    where?: TranslationProjectWhereInput
    /**
     * Limit how many TranslationProjects to delete.
     */
    limit?: number
  }

  /**
   * TranslationProject.glossaries
   */
  export type TranslationProject$glossariesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TranslationGlossary
     */
    select?: TranslationGlossarySelect<ExtArgs> | null
    /**
     * Omit specific fields from the TranslationGlossary
     */
    omit?: TranslationGlossaryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TranslationGlossaryInclude<ExtArgs> | null
    where?: TranslationGlossaryWhereInput
    orderBy?: TranslationGlossaryOrderByWithRelationInput | TranslationGlossaryOrderByWithRelationInput[]
    cursor?: TranslationGlossaryWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TranslationGlossaryScalarFieldEnum | TranslationGlossaryScalarFieldEnum[]
  }

  /**
   * TranslationProject.chapterTranslations
   */
  export type TranslationProject$chapterTranslationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChapterTranslation
     */
    select?: ChapterTranslationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ChapterTranslation
     */
    omit?: ChapterTranslationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChapterTranslationInclude<ExtArgs> | null
    where?: ChapterTranslationWhereInput
    orderBy?: ChapterTranslationOrderByWithRelationInput | ChapterTranslationOrderByWithRelationInput[]
    cursor?: ChapterTranslationWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ChapterTranslationScalarFieldEnum | ChapterTranslationScalarFieldEnum[]
  }

  /**
   * TranslationProject.runs
   */
  export type TranslationProject$runsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TranslationRun
     */
    select?: TranslationRunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TranslationRun
     */
    omit?: TranslationRunOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TranslationRunInclude<ExtArgs> | null
    where?: TranslationRunWhereInput
    orderBy?: TranslationRunOrderByWithRelationInput | TranslationRunOrderByWithRelationInput[]
    cursor?: TranslationRunWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TranslationRunScalarFieldEnum | TranslationRunScalarFieldEnum[]
  }

  /**
   * TranslationProject without action
   */
  export type TranslationProjectDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TranslationProject
     */
    select?: TranslationProjectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TranslationProject
     */
    omit?: TranslationProjectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TranslationProjectInclude<ExtArgs> | null
  }


  /**
   * Model TranslationGlossary
   */

  export type AggregateTranslationGlossary = {
    _count: TranslationGlossaryCountAggregateOutputType | null
    _avg: TranslationGlossaryAvgAggregateOutputType | null
    _sum: TranslationGlossarySumAggregateOutputType | null
    _min: TranslationGlossaryMinAggregateOutputType | null
    _max: TranslationGlossaryMaxAggregateOutputType | null
  }

  export type TranslationGlossaryAvgAggregateOutputType = {
    version: number | null
  }

  export type TranslationGlossarySumAggregateOutputType = {
    version: number | null
  }

  export type TranslationGlossaryMinAggregateOutputType = {
    id: string | null
    projectId: string | null
    version: number | null
    sourceType: string | null
    rawPayload: string | null
    isActive: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type TranslationGlossaryMaxAggregateOutputType = {
    id: string | null
    projectId: string | null
    version: number | null
    sourceType: string | null
    rawPayload: string | null
    isActive: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type TranslationGlossaryCountAggregateOutputType = {
    id: number
    projectId: number
    version: number
    sourceType: number
    rawPayload: number
    isActive: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type TranslationGlossaryAvgAggregateInputType = {
    version?: true
  }

  export type TranslationGlossarySumAggregateInputType = {
    version?: true
  }

  export type TranslationGlossaryMinAggregateInputType = {
    id?: true
    projectId?: true
    version?: true
    sourceType?: true
    rawPayload?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
  }

  export type TranslationGlossaryMaxAggregateInputType = {
    id?: true
    projectId?: true
    version?: true
    sourceType?: true
    rawPayload?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
  }

  export type TranslationGlossaryCountAggregateInputType = {
    id?: true
    projectId?: true
    version?: true
    sourceType?: true
    rawPayload?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type TranslationGlossaryAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TranslationGlossary to aggregate.
     */
    where?: TranslationGlossaryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TranslationGlossaries to fetch.
     */
    orderBy?: TranslationGlossaryOrderByWithRelationInput | TranslationGlossaryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TranslationGlossaryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TranslationGlossaries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TranslationGlossaries.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned TranslationGlossaries
    **/
    _count?: true | TranslationGlossaryCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: TranslationGlossaryAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: TranslationGlossarySumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TranslationGlossaryMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TranslationGlossaryMaxAggregateInputType
  }

  export type GetTranslationGlossaryAggregateType<T extends TranslationGlossaryAggregateArgs> = {
        [P in keyof T & keyof AggregateTranslationGlossary]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTranslationGlossary[P]>
      : GetScalarType<T[P], AggregateTranslationGlossary[P]>
  }




  export type TranslationGlossaryGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TranslationGlossaryWhereInput
    orderBy?: TranslationGlossaryOrderByWithAggregationInput | TranslationGlossaryOrderByWithAggregationInput[]
    by: TranslationGlossaryScalarFieldEnum[] | TranslationGlossaryScalarFieldEnum
    having?: TranslationGlossaryScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TranslationGlossaryCountAggregateInputType | true
    _avg?: TranslationGlossaryAvgAggregateInputType
    _sum?: TranslationGlossarySumAggregateInputType
    _min?: TranslationGlossaryMinAggregateInputType
    _max?: TranslationGlossaryMaxAggregateInputType
  }

  export type TranslationGlossaryGroupByOutputType = {
    id: string
    projectId: string
    version: number
    sourceType: string
    rawPayload: string
    isActive: boolean
    createdAt: Date
    updatedAt: Date
    _count: TranslationGlossaryCountAggregateOutputType | null
    _avg: TranslationGlossaryAvgAggregateOutputType | null
    _sum: TranslationGlossarySumAggregateOutputType | null
    _min: TranslationGlossaryMinAggregateOutputType | null
    _max: TranslationGlossaryMaxAggregateOutputType | null
  }

  type GetTranslationGlossaryGroupByPayload<T extends TranslationGlossaryGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TranslationGlossaryGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TranslationGlossaryGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TranslationGlossaryGroupByOutputType[P]>
            : GetScalarType<T[P], TranslationGlossaryGroupByOutputType[P]>
        }
      >
    >


  export type TranslationGlossarySelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    projectId?: boolean
    version?: boolean
    sourceType?: boolean
    rawPayload?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    project?: boolean | TranslationProjectDefaultArgs<ExtArgs>
    entries?: boolean | TranslationGlossary$entriesArgs<ExtArgs>
    _count?: boolean | TranslationGlossaryCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["translationGlossary"]>

  export type TranslationGlossarySelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    projectId?: boolean
    version?: boolean
    sourceType?: boolean
    rawPayload?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    project?: boolean | TranslationProjectDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["translationGlossary"]>

  export type TranslationGlossarySelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    projectId?: boolean
    version?: boolean
    sourceType?: boolean
    rawPayload?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    project?: boolean | TranslationProjectDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["translationGlossary"]>

  export type TranslationGlossarySelectScalar = {
    id?: boolean
    projectId?: boolean
    version?: boolean
    sourceType?: boolean
    rawPayload?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type TranslationGlossaryOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "projectId" | "version" | "sourceType" | "rawPayload" | "isActive" | "createdAt" | "updatedAt", ExtArgs["result"]["translationGlossary"]>
  export type TranslationGlossaryInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    project?: boolean | TranslationProjectDefaultArgs<ExtArgs>
    entries?: boolean | TranslationGlossary$entriesArgs<ExtArgs>
    _count?: boolean | TranslationGlossaryCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type TranslationGlossaryIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    project?: boolean | TranslationProjectDefaultArgs<ExtArgs>
  }
  export type TranslationGlossaryIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    project?: boolean | TranslationProjectDefaultArgs<ExtArgs>
  }

  export type $TranslationGlossaryPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "TranslationGlossary"
    objects: {
      project: Prisma.$TranslationProjectPayload<ExtArgs>
      entries: Prisma.$TranslationGlossaryEntryPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      projectId: string
      version: number
      sourceType: string
      rawPayload: string
      isActive: boolean
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["translationGlossary"]>
    composites: {}
  }

  type TranslationGlossaryGetPayload<S extends boolean | null | undefined | TranslationGlossaryDefaultArgs> = $Result.GetResult<Prisma.$TranslationGlossaryPayload, S>

  type TranslationGlossaryCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<TranslationGlossaryFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: TranslationGlossaryCountAggregateInputType | true
    }

  export interface TranslationGlossaryDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['TranslationGlossary'], meta: { name: 'TranslationGlossary' } }
    /**
     * Find zero or one TranslationGlossary that matches the filter.
     * @param {TranslationGlossaryFindUniqueArgs} args - Arguments to find a TranslationGlossary
     * @example
     * // Get one TranslationGlossary
     * const translationGlossary = await prisma.translationGlossary.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TranslationGlossaryFindUniqueArgs>(args: SelectSubset<T, TranslationGlossaryFindUniqueArgs<ExtArgs>>): Prisma__TranslationGlossaryClient<$Result.GetResult<Prisma.$TranslationGlossaryPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one TranslationGlossary that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {TranslationGlossaryFindUniqueOrThrowArgs} args - Arguments to find a TranslationGlossary
     * @example
     * // Get one TranslationGlossary
     * const translationGlossary = await prisma.translationGlossary.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TranslationGlossaryFindUniqueOrThrowArgs>(args: SelectSubset<T, TranslationGlossaryFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TranslationGlossaryClient<$Result.GetResult<Prisma.$TranslationGlossaryPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first TranslationGlossary that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TranslationGlossaryFindFirstArgs} args - Arguments to find a TranslationGlossary
     * @example
     * // Get one TranslationGlossary
     * const translationGlossary = await prisma.translationGlossary.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TranslationGlossaryFindFirstArgs>(args?: SelectSubset<T, TranslationGlossaryFindFirstArgs<ExtArgs>>): Prisma__TranslationGlossaryClient<$Result.GetResult<Prisma.$TranslationGlossaryPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first TranslationGlossary that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TranslationGlossaryFindFirstOrThrowArgs} args - Arguments to find a TranslationGlossary
     * @example
     * // Get one TranslationGlossary
     * const translationGlossary = await prisma.translationGlossary.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TranslationGlossaryFindFirstOrThrowArgs>(args?: SelectSubset<T, TranslationGlossaryFindFirstOrThrowArgs<ExtArgs>>): Prisma__TranslationGlossaryClient<$Result.GetResult<Prisma.$TranslationGlossaryPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more TranslationGlossaries that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TranslationGlossaryFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all TranslationGlossaries
     * const translationGlossaries = await prisma.translationGlossary.findMany()
     * 
     * // Get first 10 TranslationGlossaries
     * const translationGlossaries = await prisma.translationGlossary.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const translationGlossaryWithIdOnly = await prisma.translationGlossary.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends TranslationGlossaryFindManyArgs>(args?: SelectSubset<T, TranslationGlossaryFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TranslationGlossaryPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a TranslationGlossary.
     * @param {TranslationGlossaryCreateArgs} args - Arguments to create a TranslationGlossary.
     * @example
     * // Create one TranslationGlossary
     * const TranslationGlossary = await prisma.translationGlossary.create({
     *   data: {
     *     // ... data to create a TranslationGlossary
     *   }
     * })
     * 
     */
    create<T extends TranslationGlossaryCreateArgs>(args: SelectSubset<T, TranslationGlossaryCreateArgs<ExtArgs>>): Prisma__TranslationGlossaryClient<$Result.GetResult<Prisma.$TranslationGlossaryPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many TranslationGlossaries.
     * @param {TranslationGlossaryCreateManyArgs} args - Arguments to create many TranslationGlossaries.
     * @example
     * // Create many TranslationGlossaries
     * const translationGlossary = await prisma.translationGlossary.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TranslationGlossaryCreateManyArgs>(args?: SelectSubset<T, TranslationGlossaryCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many TranslationGlossaries and returns the data saved in the database.
     * @param {TranslationGlossaryCreateManyAndReturnArgs} args - Arguments to create many TranslationGlossaries.
     * @example
     * // Create many TranslationGlossaries
     * const translationGlossary = await prisma.translationGlossary.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many TranslationGlossaries and only return the `id`
     * const translationGlossaryWithIdOnly = await prisma.translationGlossary.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends TranslationGlossaryCreateManyAndReturnArgs>(args?: SelectSubset<T, TranslationGlossaryCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TranslationGlossaryPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a TranslationGlossary.
     * @param {TranslationGlossaryDeleteArgs} args - Arguments to delete one TranslationGlossary.
     * @example
     * // Delete one TranslationGlossary
     * const TranslationGlossary = await prisma.translationGlossary.delete({
     *   where: {
     *     // ... filter to delete one TranslationGlossary
     *   }
     * })
     * 
     */
    delete<T extends TranslationGlossaryDeleteArgs>(args: SelectSubset<T, TranslationGlossaryDeleteArgs<ExtArgs>>): Prisma__TranslationGlossaryClient<$Result.GetResult<Prisma.$TranslationGlossaryPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one TranslationGlossary.
     * @param {TranslationGlossaryUpdateArgs} args - Arguments to update one TranslationGlossary.
     * @example
     * // Update one TranslationGlossary
     * const translationGlossary = await prisma.translationGlossary.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TranslationGlossaryUpdateArgs>(args: SelectSubset<T, TranslationGlossaryUpdateArgs<ExtArgs>>): Prisma__TranslationGlossaryClient<$Result.GetResult<Prisma.$TranslationGlossaryPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more TranslationGlossaries.
     * @param {TranslationGlossaryDeleteManyArgs} args - Arguments to filter TranslationGlossaries to delete.
     * @example
     * // Delete a few TranslationGlossaries
     * const { count } = await prisma.translationGlossary.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TranslationGlossaryDeleteManyArgs>(args?: SelectSubset<T, TranslationGlossaryDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more TranslationGlossaries.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TranslationGlossaryUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many TranslationGlossaries
     * const translationGlossary = await prisma.translationGlossary.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TranslationGlossaryUpdateManyArgs>(args: SelectSubset<T, TranslationGlossaryUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more TranslationGlossaries and returns the data updated in the database.
     * @param {TranslationGlossaryUpdateManyAndReturnArgs} args - Arguments to update many TranslationGlossaries.
     * @example
     * // Update many TranslationGlossaries
     * const translationGlossary = await prisma.translationGlossary.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more TranslationGlossaries and only return the `id`
     * const translationGlossaryWithIdOnly = await prisma.translationGlossary.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends TranslationGlossaryUpdateManyAndReturnArgs>(args: SelectSubset<T, TranslationGlossaryUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TranslationGlossaryPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one TranslationGlossary.
     * @param {TranslationGlossaryUpsertArgs} args - Arguments to update or create a TranslationGlossary.
     * @example
     * // Update or create a TranslationGlossary
     * const translationGlossary = await prisma.translationGlossary.upsert({
     *   create: {
     *     // ... data to create a TranslationGlossary
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the TranslationGlossary we want to update
     *   }
     * })
     */
    upsert<T extends TranslationGlossaryUpsertArgs>(args: SelectSubset<T, TranslationGlossaryUpsertArgs<ExtArgs>>): Prisma__TranslationGlossaryClient<$Result.GetResult<Prisma.$TranslationGlossaryPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of TranslationGlossaries.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TranslationGlossaryCountArgs} args - Arguments to filter TranslationGlossaries to count.
     * @example
     * // Count the number of TranslationGlossaries
     * const count = await prisma.translationGlossary.count({
     *   where: {
     *     // ... the filter for the TranslationGlossaries we want to count
     *   }
     * })
    **/
    count<T extends TranslationGlossaryCountArgs>(
      args?: Subset<T, TranslationGlossaryCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TranslationGlossaryCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a TranslationGlossary.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TranslationGlossaryAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TranslationGlossaryAggregateArgs>(args: Subset<T, TranslationGlossaryAggregateArgs>): Prisma.PrismaPromise<GetTranslationGlossaryAggregateType<T>>

    /**
     * Group by TranslationGlossary.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TranslationGlossaryGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends TranslationGlossaryGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TranslationGlossaryGroupByArgs['orderBy'] }
        : { orderBy?: TranslationGlossaryGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, TranslationGlossaryGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTranslationGlossaryGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the TranslationGlossary model
   */
  readonly fields: TranslationGlossaryFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for TranslationGlossary.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TranslationGlossaryClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    project<T extends TranslationProjectDefaultArgs<ExtArgs> = {}>(args?: Subset<T, TranslationProjectDefaultArgs<ExtArgs>>): Prisma__TranslationProjectClient<$Result.GetResult<Prisma.$TranslationProjectPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    entries<T extends TranslationGlossary$entriesArgs<ExtArgs> = {}>(args?: Subset<T, TranslationGlossary$entriesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TranslationGlossaryEntryPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the TranslationGlossary model
   */
  interface TranslationGlossaryFieldRefs {
    readonly id: FieldRef<"TranslationGlossary", 'String'>
    readonly projectId: FieldRef<"TranslationGlossary", 'String'>
    readonly version: FieldRef<"TranslationGlossary", 'Int'>
    readonly sourceType: FieldRef<"TranslationGlossary", 'String'>
    readonly rawPayload: FieldRef<"TranslationGlossary", 'String'>
    readonly isActive: FieldRef<"TranslationGlossary", 'Boolean'>
    readonly createdAt: FieldRef<"TranslationGlossary", 'DateTime'>
    readonly updatedAt: FieldRef<"TranslationGlossary", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * TranslationGlossary findUnique
   */
  export type TranslationGlossaryFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TranslationGlossary
     */
    select?: TranslationGlossarySelect<ExtArgs> | null
    /**
     * Omit specific fields from the TranslationGlossary
     */
    omit?: TranslationGlossaryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TranslationGlossaryInclude<ExtArgs> | null
    /**
     * Filter, which TranslationGlossary to fetch.
     */
    where: TranslationGlossaryWhereUniqueInput
  }

  /**
   * TranslationGlossary findUniqueOrThrow
   */
  export type TranslationGlossaryFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TranslationGlossary
     */
    select?: TranslationGlossarySelect<ExtArgs> | null
    /**
     * Omit specific fields from the TranslationGlossary
     */
    omit?: TranslationGlossaryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TranslationGlossaryInclude<ExtArgs> | null
    /**
     * Filter, which TranslationGlossary to fetch.
     */
    where: TranslationGlossaryWhereUniqueInput
  }

  /**
   * TranslationGlossary findFirst
   */
  export type TranslationGlossaryFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TranslationGlossary
     */
    select?: TranslationGlossarySelect<ExtArgs> | null
    /**
     * Omit specific fields from the TranslationGlossary
     */
    omit?: TranslationGlossaryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TranslationGlossaryInclude<ExtArgs> | null
    /**
     * Filter, which TranslationGlossary to fetch.
     */
    where?: TranslationGlossaryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TranslationGlossaries to fetch.
     */
    orderBy?: TranslationGlossaryOrderByWithRelationInput | TranslationGlossaryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TranslationGlossaries.
     */
    cursor?: TranslationGlossaryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TranslationGlossaries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TranslationGlossaries.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TranslationGlossaries.
     */
    distinct?: TranslationGlossaryScalarFieldEnum | TranslationGlossaryScalarFieldEnum[]
  }

  /**
   * TranslationGlossary findFirstOrThrow
   */
  export type TranslationGlossaryFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TranslationGlossary
     */
    select?: TranslationGlossarySelect<ExtArgs> | null
    /**
     * Omit specific fields from the TranslationGlossary
     */
    omit?: TranslationGlossaryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TranslationGlossaryInclude<ExtArgs> | null
    /**
     * Filter, which TranslationGlossary to fetch.
     */
    where?: TranslationGlossaryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TranslationGlossaries to fetch.
     */
    orderBy?: TranslationGlossaryOrderByWithRelationInput | TranslationGlossaryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TranslationGlossaries.
     */
    cursor?: TranslationGlossaryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TranslationGlossaries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TranslationGlossaries.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TranslationGlossaries.
     */
    distinct?: TranslationGlossaryScalarFieldEnum | TranslationGlossaryScalarFieldEnum[]
  }

  /**
   * TranslationGlossary findMany
   */
  export type TranslationGlossaryFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TranslationGlossary
     */
    select?: TranslationGlossarySelect<ExtArgs> | null
    /**
     * Omit specific fields from the TranslationGlossary
     */
    omit?: TranslationGlossaryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TranslationGlossaryInclude<ExtArgs> | null
    /**
     * Filter, which TranslationGlossaries to fetch.
     */
    where?: TranslationGlossaryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TranslationGlossaries to fetch.
     */
    orderBy?: TranslationGlossaryOrderByWithRelationInput | TranslationGlossaryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing TranslationGlossaries.
     */
    cursor?: TranslationGlossaryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TranslationGlossaries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TranslationGlossaries.
     */
    skip?: number
    distinct?: TranslationGlossaryScalarFieldEnum | TranslationGlossaryScalarFieldEnum[]
  }

  /**
   * TranslationGlossary create
   */
  export type TranslationGlossaryCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TranslationGlossary
     */
    select?: TranslationGlossarySelect<ExtArgs> | null
    /**
     * Omit specific fields from the TranslationGlossary
     */
    omit?: TranslationGlossaryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TranslationGlossaryInclude<ExtArgs> | null
    /**
     * The data needed to create a TranslationGlossary.
     */
    data: XOR<TranslationGlossaryCreateInput, TranslationGlossaryUncheckedCreateInput>
  }

  /**
   * TranslationGlossary createMany
   */
  export type TranslationGlossaryCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many TranslationGlossaries.
     */
    data: TranslationGlossaryCreateManyInput | TranslationGlossaryCreateManyInput[]
  }

  /**
   * TranslationGlossary createManyAndReturn
   */
  export type TranslationGlossaryCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TranslationGlossary
     */
    select?: TranslationGlossarySelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the TranslationGlossary
     */
    omit?: TranslationGlossaryOmit<ExtArgs> | null
    /**
     * The data used to create many TranslationGlossaries.
     */
    data: TranslationGlossaryCreateManyInput | TranslationGlossaryCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TranslationGlossaryIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * TranslationGlossary update
   */
  export type TranslationGlossaryUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TranslationGlossary
     */
    select?: TranslationGlossarySelect<ExtArgs> | null
    /**
     * Omit specific fields from the TranslationGlossary
     */
    omit?: TranslationGlossaryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TranslationGlossaryInclude<ExtArgs> | null
    /**
     * The data needed to update a TranslationGlossary.
     */
    data: XOR<TranslationGlossaryUpdateInput, TranslationGlossaryUncheckedUpdateInput>
    /**
     * Choose, which TranslationGlossary to update.
     */
    where: TranslationGlossaryWhereUniqueInput
  }

  /**
   * TranslationGlossary updateMany
   */
  export type TranslationGlossaryUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update TranslationGlossaries.
     */
    data: XOR<TranslationGlossaryUpdateManyMutationInput, TranslationGlossaryUncheckedUpdateManyInput>
    /**
     * Filter which TranslationGlossaries to update
     */
    where?: TranslationGlossaryWhereInput
    /**
     * Limit how many TranslationGlossaries to update.
     */
    limit?: number
  }

  /**
   * TranslationGlossary updateManyAndReturn
   */
  export type TranslationGlossaryUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TranslationGlossary
     */
    select?: TranslationGlossarySelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the TranslationGlossary
     */
    omit?: TranslationGlossaryOmit<ExtArgs> | null
    /**
     * The data used to update TranslationGlossaries.
     */
    data: XOR<TranslationGlossaryUpdateManyMutationInput, TranslationGlossaryUncheckedUpdateManyInput>
    /**
     * Filter which TranslationGlossaries to update
     */
    where?: TranslationGlossaryWhereInput
    /**
     * Limit how many TranslationGlossaries to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TranslationGlossaryIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * TranslationGlossary upsert
   */
  export type TranslationGlossaryUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TranslationGlossary
     */
    select?: TranslationGlossarySelect<ExtArgs> | null
    /**
     * Omit specific fields from the TranslationGlossary
     */
    omit?: TranslationGlossaryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TranslationGlossaryInclude<ExtArgs> | null
    /**
     * The filter to search for the TranslationGlossary to update in case it exists.
     */
    where: TranslationGlossaryWhereUniqueInput
    /**
     * In case the TranslationGlossary found by the `where` argument doesn't exist, create a new TranslationGlossary with this data.
     */
    create: XOR<TranslationGlossaryCreateInput, TranslationGlossaryUncheckedCreateInput>
    /**
     * In case the TranslationGlossary was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TranslationGlossaryUpdateInput, TranslationGlossaryUncheckedUpdateInput>
  }

  /**
   * TranslationGlossary delete
   */
  export type TranslationGlossaryDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TranslationGlossary
     */
    select?: TranslationGlossarySelect<ExtArgs> | null
    /**
     * Omit specific fields from the TranslationGlossary
     */
    omit?: TranslationGlossaryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TranslationGlossaryInclude<ExtArgs> | null
    /**
     * Filter which TranslationGlossary to delete.
     */
    where: TranslationGlossaryWhereUniqueInput
  }

  /**
   * TranslationGlossary deleteMany
   */
  export type TranslationGlossaryDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TranslationGlossaries to delete
     */
    where?: TranslationGlossaryWhereInput
    /**
     * Limit how many TranslationGlossaries to delete.
     */
    limit?: number
  }

  /**
   * TranslationGlossary.entries
   */
  export type TranslationGlossary$entriesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TranslationGlossaryEntry
     */
    select?: TranslationGlossaryEntrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the TranslationGlossaryEntry
     */
    omit?: TranslationGlossaryEntryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TranslationGlossaryEntryInclude<ExtArgs> | null
    where?: TranslationGlossaryEntryWhereInput
    orderBy?: TranslationGlossaryEntryOrderByWithRelationInput | TranslationGlossaryEntryOrderByWithRelationInput[]
    cursor?: TranslationGlossaryEntryWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TranslationGlossaryEntryScalarFieldEnum | TranslationGlossaryEntryScalarFieldEnum[]
  }

  /**
   * TranslationGlossary without action
   */
  export type TranslationGlossaryDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TranslationGlossary
     */
    select?: TranslationGlossarySelect<ExtArgs> | null
    /**
     * Omit specific fields from the TranslationGlossary
     */
    omit?: TranslationGlossaryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TranslationGlossaryInclude<ExtArgs> | null
  }


  /**
   * Model TranslationGlossaryEntry
   */

  export type AggregateTranslationGlossaryEntry = {
    _count: TranslationGlossaryEntryCountAggregateOutputType | null
    _avg: TranslationGlossaryEntryAvgAggregateOutputType | null
    _sum: TranslationGlossaryEntrySumAggregateOutputType | null
    _min: TranslationGlossaryEntryMinAggregateOutputType | null
    _max: TranslationGlossaryEntryMaxAggregateOutputType | null
  }

  export type TranslationGlossaryEntryAvgAggregateOutputType = {
    priority: number | null
  }

  export type TranslationGlossaryEntrySumAggregateOutputType = {
    priority: number | null
  }

  export type TranslationGlossaryEntryMinAggregateOutputType = {
    id: string | null
    glossaryId: string | null
    type: string | null
    rawName: string | null
    translatedName: string | null
    viLabel: string | null
    gender: string | null
    description: string | null
    aliasesJson: string | null
    notes: string | null
    locked: boolean | null
    priority: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type TranslationGlossaryEntryMaxAggregateOutputType = {
    id: string | null
    glossaryId: string | null
    type: string | null
    rawName: string | null
    translatedName: string | null
    viLabel: string | null
    gender: string | null
    description: string | null
    aliasesJson: string | null
    notes: string | null
    locked: boolean | null
    priority: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type TranslationGlossaryEntryCountAggregateOutputType = {
    id: number
    glossaryId: number
    type: number
    rawName: number
    translatedName: number
    viLabel: number
    gender: number
    description: number
    aliasesJson: number
    notes: number
    locked: number
    priority: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type TranslationGlossaryEntryAvgAggregateInputType = {
    priority?: true
  }

  export type TranslationGlossaryEntrySumAggregateInputType = {
    priority?: true
  }

  export type TranslationGlossaryEntryMinAggregateInputType = {
    id?: true
    glossaryId?: true
    type?: true
    rawName?: true
    translatedName?: true
    viLabel?: true
    gender?: true
    description?: true
    aliasesJson?: true
    notes?: true
    locked?: true
    priority?: true
    createdAt?: true
    updatedAt?: true
  }

  export type TranslationGlossaryEntryMaxAggregateInputType = {
    id?: true
    glossaryId?: true
    type?: true
    rawName?: true
    translatedName?: true
    viLabel?: true
    gender?: true
    description?: true
    aliasesJson?: true
    notes?: true
    locked?: true
    priority?: true
    createdAt?: true
    updatedAt?: true
  }

  export type TranslationGlossaryEntryCountAggregateInputType = {
    id?: true
    glossaryId?: true
    type?: true
    rawName?: true
    translatedName?: true
    viLabel?: true
    gender?: true
    description?: true
    aliasesJson?: true
    notes?: true
    locked?: true
    priority?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type TranslationGlossaryEntryAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TranslationGlossaryEntry to aggregate.
     */
    where?: TranslationGlossaryEntryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TranslationGlossaryEntries to fetch.
     */
    orderBy?: TranslationGlossaryEntryOrderByWithRelationInput | TranslationGlossaryEntryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TranslationGlossaryEntryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TranslationGlossaryEntries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TranslationGlossaryEntries.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned TranslationGlossaryEntries
    **/
    _count?: true | TranslationGlossaryEntryCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: TranslationGlossaryEntryAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: TranslationGlossaryEntrySumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TranslationGlossaryEntryMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TranslationGlossaryEntryMaxAggregateInputType
  }

  export type GetTranslationGlossaryEntryAggregateType<T extends TranslationGlossaryEntryAggregateArgs> = {
        [P in keyof T & keyof AggregateTranslationGlossaryEntry]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTranslationGlossaryEntry[P]>
      : GetScalarType<T[P], AggregateTranslationGlossaryEntry[P]>
  }




  export type TranslationGlossaryEntryGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TranslationGlossaryEntryWhereInput
    orderBy?: TranslationGlossaryEntryOrderByWithAggregationInput | TranslationGlossaryEntryOrderByWithAggregationInput[]
    by: TranslationGlossaryEntryScalarFieldEnum[] | TranslationGlossaryEntryScalarFieldEnum
    having?: TranslationGlossaryEntryScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TranslationGlossaryEntryCountAggregateInputType | true
    _avg?: TranslationGlossaryEntryAvgAggregateInputType
    _sum?: TranslationGlossaryEntrySumAggregateInputType
    _min?: TranslationGlossaryEntryMinAggregateInputType
    _max?: TranslationGlossaryEntryMaxAggregateInputType
  }

  export type TranslationGlossaryEntryGroupByOutputType = {
    id: string
    glossaryId: string
    type: string
    rawName: string
    translatedName: string
    viLabel: string | null
    gender: string | null
    description: string | null
    aliasesJson: string
    notes: string | null
    locked: boolean
    priority: number
    createdAt: Date
    updatedAt: Date
    _count: TranslationGlossaryEntryCountAggregateOutputType | null
    _avg: TranslationGlossaryEntryAvgAggregateOutputType | null
    _sum: TranslationGlossaryEntrySumAggregateOutputType | null
    _min: TranslationGlossaryEntryMinAggregateOutputType | null
    _max: TranslationGlossaryEntryMaxAggregateOutputType | null
  }

  type GetTranslationGlossaryEntryGroupByPayload<T extends TranslationGlossaryEntryGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TranslationGlossaryEntryGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TranslationGlossaryEntryGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TranslationGlossaryEntryGroupByOutputType[P]>
            : GetScalarType<T[P], TranslationGlossaryEntryGroupByOutputType[P]>
        }
      >
    >


  export type TranslationGlossaryEntrySelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    glossaryId?: boolean
    type?: boolean
    rawName?: boolean
    translatedName?: boolean
    viLabel?: boolean
    gender?: boolean
    description?: boolean
    aliasesJson?: boolean
    notes?: boolean
    locked?: boolean
    priority?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    glossary?: boolean | TranslationGlossaryDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["translationGlossaryEntry"]>

  export type TranslationGlossaryEntrySelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    glossaryId?: boolean
    type?: boolean
    rawName?: boolean
    translatedName?: boolean
    viLabel?: boolean
    gender?: boolean
    description?: boolean
    aliasesJson?: boolean
    notes?: boolean
    locked?: boolean
    priority?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    glossary?: boolean | TranslationGlossaryDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["translationGlossaryEntry"]>

  export type TranslationGlossaryEntrySelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    glossaryId?: boolean
    type?: boolean
    rawName?: boolean
    translatedName?: boolean
    viLabel?: boolean
    gender?: boolean
    description?: boolean
    aliasesJson?: boolean
    notes?: boolean
    locked?: boolean
    priority?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    glossary?: boolean | TranslationGlossaryDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["translationGlossaryEntry"]>

  export type TranslationGlossaryEntrySelectScalar = {
    id?: boolean
    glossaryId?: boolean
    type?: boolean
    rawName?: boolean
    translatedName?: boolean
    viLabel?: boolean
    gender?: boolean
    description?: boolean
    aliasesJson?: boolean
    notes?: boolean
    locked?: boolean
    priority?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type TranslationGlossaryEntryOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "glossaryId" | "type" | "rawName" | "translatedName" | "viLabel" | "gender" | "description" | "aliasesJson" | "notes" | "locked" | "priority" | "createdAt" | "updatedAt", ExtArgs["result"]["translationGlossaryEntry"]>
  export type TranslationGlossaryEntryInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    glossary?: boolean | TranslationGlossaryDefaultArgs<ExtArgs>
  }
  export type TranslationGlossaryEntryIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    glossary?: boolean | TranslationGlossaryDefaultArgs<ExtArgs>
  }
  export type TranslationGlossaryEntryIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    glossary?: boolean | TranslationGlossaryDefaultArgs<ExtArgs>
  }

  export type $TranslationGlossaryEntryPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "TranslationGlossaryEntry"
    objects: {
      glossary: Prisma.$TranslationGlossaryPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      glossaryId: string
      type: string
      rawName: string
      translatedName: string
      viLabel: string | null
      gender: string | null
      description: string | null
      aliasesJson: string
      notes: string | null
      locked: boolean
      priority: number
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["translationGlossaryEntry"]>
    composites: {}
  }

  type TranslationGlossaryEntryGetPayload<S extends boolean | null | undefined | TranslationGlossaryEntryDefaultArgs> = $Result.GetResult<Prisma.$TranslationGlossaryEntryPayload, S>

  type TranslationGlossaryEntryCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<TranslationGlossaryEntryFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: TranslationGlossaryEntryCountAggregateInputType | true
    }

  export interface TranslationGlossaryEntryDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['TranslationGlossaryEntry'], meta: { name: 'TranslationGlossaryEntry' } }
    /**
     * Find zero or one TranslationGlossaryEntry that matches the filter.
     * @param {TranslationGlossaryEntryFindUniqueArgs} args - Arguments to find a TranslationGlossaryEntry
     * @example
     * // Get one TranslationGlossaryEntry
     * const translationGlossaryEntry = await prisma.translationGlossaryEntry.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TranslationGlossaryEntryFindUniqueArgs>(args: SelectSubset<T, TranslationGlossaryEntryFindUniqueArgs<ExtArgs>>): Prisma__TranslationGlossaryEntryClient<$Result.GetResult<Prisma.$TranslationGlossaryEntryPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one TranslationGlossaryEntry that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {TranslationGlossaryEntryFindUniqueOrThrowArgs} args - Arguments to find a TranslationGlossaryEntry
     * @example
     * // Get one TranslationGlossaryEntry
     * const translationGlossaryEntry = await prisma.translationGlossaryEntry.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TranslationGlossaryEntryFindUniqueOrThrowArgs>(args: SelectSubset<T, TranslationGlossaryEntryFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TranslationGlossaryEntryClient<$Result.GetResult<Prisma.$TranslationGlossaryEntryPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first TranslationGlossaryEntry that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TranslationGlossaryEntryFindFirstArgs} args - Arguments to find a TranslationGlossaryEntry
     * @example
     * // Get one TranslationGlossaryEntry
     * const translationGlossaryEntry = await prisma.translationGlossaryEntry.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TranslationGlossaryEntryFindFirstArgs>(args?: SelectSubset<T, TranslationGlossaryEntryFindFirstArgs<ExtArgs>>): Prisma__TranslationGlossaryEntryClient<$Result.GetResult<Prisma.$TranslationGlossaryEntryPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first TranslationGlossaryEntry that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TranslationGlossaryEntryFindFirstOrThrowArgs} args - Arguments to find a TranslationGlossaryEntry
     * @example
     * // Get one TranslationGlossaryEntry
     * const translationGlossaryEntry = await prisma.translationGlossaryEntry.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TranslationGlossaryEntryFindFirstOrThrowArgs>(args?: SelectSubset<T, TranslationGlossaryEntryFindFirstOrThrowArgs<ExtArgs>>): Prisma__TranslationGlossaryEntryClient<$Result.GetResult<Prisma.$TranslationGlossaryEntryPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more TranslationGlossaryEntries that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TranslationGlossaryEntryFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all TranslationGlossaryEntries
     * const translationGlossaryEntries = await prisma.translationGlossaryEntry.findMany()
     * 
     * // Get first 10 TranslationGlossaryEntries
     * const translationGlossaryEntries = await prisma.translationGlossaryEntry.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const translationGlossaryEntryWithIdOnly = await prisma.translationGlossaryEntry.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends TranslationGlossaryEntryFindManyArgs>(args?: SelectSubset<T, TranslationGlossaryEntryFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TranslationGlossaryEntryPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a TranslationGlossaryEntry.
     * @param {TranslationGlossaryEntryCreateArgs} args - Arguments to create a TranslationGlossaryEntry.
     * @example
     * // Create one TranslationGlossaryEntry
     * const TranslationGlossaryEntry = await prisma.translationGlossaryEntry.create({
     *   data: {
     *     // ... data to create a TranslationGlossaryEntry
     *   }
     * })
     * 
     */
    create<T extends TranslationGlossaryEntryCreateArgs>(args: SelectSubset<T, TranslationGlossaryEntryCreateArgs<ExtArgs>>): Prisma__TranslationGlossaryEntryClient<$Result.GetResult<Prisma.$TranslationGlossaryEntryPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many TranslationGlossaryEntries.
     * @param {TranslationGlossaryEntryCreateManyArgs} args - Arguments to create many TranslationGlossaryEntries.
     * @example
     * // Create many TranslationGlossaryEntries
     * const translationGlossaryEntry = await prisma.translationGlossaryEntry.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TranslationGlossaryEntryCreateManyArgs>(args?: SelectSubset<T, TranslationGlossaryEntryCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many TranslationGlossaryEntries and returns the data saved in the database.
     * @param {TranslationGlossaryEntryCreateManyAndReturnArgs} args - Arguments to create many TranslationGlossaryEntries.
     * @example
     * // Create many TranslationGlossaryEntries
     * const translationGlossaryEntry = await prisma.translationGlossaryEntry.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many TranslationGlossaryEntries and only return the `id`
     * const translationGlossaryEntryWithIdOnly = await prisma.translationGlossaryEntry.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends TranslationGlossaryEntryCreateManyAndReturnArgs>(args?: SelectSubset<T, TranslationGlossaryEntryCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TranslationGlossaryEntryPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a TranslationGlossaryEntry.
     * @param {TranslationGlossaryEntryDeleteArgs} args - Arguments to delete one TranslationGlossaryEntry.
     * @example
     * // Delete one TranslationGlossaryEntry
     * const TranslationGlossaryEntry = await prisma.translationGlossaryEntry.delete({
     *   where: {
     *     // ... filter to delete one TranslationGlossaryEntry
     *   }
     * })
     * 
     */
    delete<T extends TranslationGlossaryEntryDeleteArgs>(args: SelectSubset<T, TranslationGlossaryEntryDeleteArgs<ExtArgs>>): Prisma__TranslationGlossaryEntryClient<$Result.GetResult<Prisma.$TranslationGlossaryEntryPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one TranslationGlossaryEntry.
     * @param {TranslationGlossaryEntryUpdateArgs} args - Arguments to update one TranslationGlossaryEntry.
     * @example
     * // Update one TranslationGlossaryEntry
     * const translationGlossaryEntry = await prisma.translationGlossaryEntry.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TranslationGlossaryEntryUpdateArgs>(args: SelectSubset<T, TranslationGlossaryEntryUpdateArgs<ExtArgs>>): Prisma__TranslationGlossaryEntryClient<$Result.GetResult<Prisma.$TranslationGlossaryEntryPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more TranslationGlossaryEntries.
     * @param {TranslationGlossaryEntryDeleteManyArgs} args - Arguments to filter TranslationGlossaryEntries to delete.
     * @example
     * // Delete a few TranslationGlossaryEntries
     * const { count } = await prisma.translationGlossaryEntry.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TranslationGlossaryEntryDeleteManyArgs>(args?: SelectSubset<T, TranslationGlossaryEntryDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more TranslationGlossaryEntries.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TranslationGlossaryEntryUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many TranslationGlossaryEntries
     * const translationGlossaryEntry = await prisma.translationGlossaryEntry.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TranslationGlossaryEntryUpdateManyArgs>(args: SelectSubset<T, TranslationGlossaryEntryUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more TranslationGlossaryEntries and returns the data updated in the database.
     * @param {TranslationGlossaryEntryUpdateManyAndReturnArgs} args - Arguments to update many TranslationGlossaryEntries.
     * @example
     * // Update many TranslationGlossaryEntries
     * const translationGlossaryEntry = await prisma.translationGlossaryEntry.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more TranslationGlossaryEntries and only return the `id`
     * const translationGlossaryEntryWithIdOnly = await prisma.translationGlossaryEntry.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends TranslationGlossaryEntryUpdateManyAndReturnArgs>(args: SelectSubset<T, TranslationGlossaryEntryUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TranslationGlossaryEntryPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one TranslationGlossaryEntry.
     * @param {TranslationGlossaryEntryUpsertArgs} args - Arguments to update or create a TranslationGlossaryEntry.
     * @example
     * // Update or create a TranslationGlossaryEntry
     * const translationGlossaryEntry = await prisma.translationGlossaryEntry.upsert({
     *   create: {
     *     // ... data to create a TranslationGlossaryEntry
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the TranslationGlossaryEntry we want to update
     *   }
     * })
     */
    upsert<T extends TranslationGlossaryEntryUpsertArgs>(args: SelectSubset<T, TranslationGlossaryEntryUpsertArgs<ExtArgs>>): Prisma__TranslationGlossaryEntryClient<$Result.GetResult<Prisma.$TranslationGlossaryEntryPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of TranslationGlossaryEntries.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TranslationGlossaryEntryCountArgs} args - Arguments to filter TranslationGlossaryEntries to count.
     * @example
     * // Count the number of TranslationGlossaryEntries
     * const count = await prisma.translationGlossaryEntry.count({
     *   where: {
     *     // ... the filter for the TranslationGlossaryEntries we want to count
     *   }
     * })
    **/
    count<T extends TranslationGlossaryEntryCountArgs>(
      args?: Subset<T, TranslationGlossaryEntryCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TranslationGlossaryEntryCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a TranslationGlossaryEntry.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TranslationGlossaryEntryAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TranslationGlossaryEntryAggregateArgs>(args: Subset<T, TranslationGlossaryEntryAggregateArgs>): Prisma.PrismaPromise<GetTranslationGlossaryEntryAggregateType<T>>

    /**
     * Group by TranslationGlossaryEntry.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TranslationGlossaryEntryGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends TranslationGlossaryEntryGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TranslationGlossaryEntryGroupByArgs['orderBy'] }
        : { orderBy?: TranslationGlossaryEntryGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, TranslationGlossaryEntryGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTranslationGlossaryEntryGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the TranslationGlossaryEntry model
   */
  readonly fields: TranslationGlossaryEntryFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for TranslationGlossaryEntry.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TranslationGlossaryEntryClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    glossary<T extends TranslationGlossaryDefaultArgs<ExtArgs> = {}>(args?: Subset<T, TranslationGlossaryDefaultArgs<ExtArgs>>): Prisma__TranslationGlossaryClient<$Result.GetResult<Prisma.$TranslationGlossaryPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the TranslationGlossaryEntry model
   */
  interface TranslationGlossaryEntryFieldRefs {
    readonly id: FieldRef<"TranslationGlossaryEntry", 'String'>
    readonly glossaryId: FieldRef<"TranslationGlossaryEntry", 'String'>
    readonly type: FieldRef<"TranslationGlossaryEntry", 'String'>
    readonly rawName: FieldRef<"TranslationGlossaryEntry", 'String'>
    readonly translatedName: FieldRef<"TranslationGlossaryEntry", 'String'>
    readonly viLabel: FieldRef<"TranslationGlossaryEntry", 'String'>
    readonly gender: FieldRef<"TranslationGlossaryEntry", 'String'>
    readonly description: FieldRef<"TranslationGlossaryEntry", 'String'>
    readonly aliasesJson: FieldRef<"TranslationGlossaryEntry", 'String'>
    readonly notes: FieldRef<"TranslationGlossaryEntry", 'String'>
    readonly locked: FieldRef<"TranslationGlossaryEntry", 'Boolean'>
    readonly priority: FieldRef<"TranslationGlossaryEntry", 'Int'>
    readonly createdAt: FieldRef<"TranslationGlossaryEntry", 'DateTime'>
    readonly updatedAt: FieldRef<"TranslationGlossaryEntry", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * TranslationGlossaryEntry findUnique
   */
  export type TranslationGlossaryEntryFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TranslationGlossaryEntry
     */
    select?: TranslationGlossaryEntrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the TranslationGlossaryEntry
     */
    omit?: TranslationGlossaryEntryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TranslationGlossaryEntryInclude<ExtArgs> | null
    /**
     * Filter, which TranslationGlossaryEntry to fetch.
     */
    where: TranslationGlossaryEntryWhereUniqueInput
  }

  /**
   * TranslationGlossaryEntry findUniqueOrThrow
   */
  export type TranslationGlossaryEntryFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TranslationGlossaryEntry
     */
    select?: TranslationGlossaryEntrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the TranslationGlossaryEntry
     */
    omit?: TranslationGlossaryEntryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TranslationGlossaryEntryInclude<ExtArgs> | null
    /**
     * Filter, which TranslationGlossaryEntry to fetch.
     */
    where: TranslationGlossaryEntryWhereUniqueInput
  }

  /**
   * TranslationGlossaryEntry findFirst
   */
  export type TranslationGlossaryEntryFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TranslationGlossaryEntry
     */
    select?: TranslationGlossaryEntrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the TranslationGlossaryEntry
     */
    omit?: TranslationGlossaryEntryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TranslationGlossaryEntryInclude<ExtArgs> | null
    /**
     * Filter, which TranslationGlossaryEntry to fetch.
     */
    where?: TranslationGlossaryEntryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TranslationGlossaryEntries to fetch.
     */
    orderBy?: TranslationGlossaryEntryOrderByWithRelationInput | TranslationGlossaryEntryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TranslationGlossaryEntries.
     */
    cursor?: TranslationGlossaryEntryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TranslationGlossaryEntries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TranslationGlossaryEntries.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TranslationGlossaryEntries.
     */
    distinct?: TranslationGlossaryEntryScalarFieldEnum | TranslationGlossaryEntryScalarFieldEnum[]
  }

  /**
   * TranslationGlossaryEntry findFirstOrThrow
   */
  export type TranslationGlossaryEntryFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TranslationGlossaryEntry
     */
    select?: TranslationGlossaryEntrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the TranslationGlossaryEntry
     */
    omit?: TranslationGlossaryEntryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TranslationGlossaryEntryInclude<ExtArgs> | null
    /**
     * Filter, which TranslationGlossaryEntry to fetch.
     */
    where?: TranslationGlossaryEntryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TranslationGlossaryEntries to fetch.
     */
    orderBy?: TranslationGlossaryEntryOrderByWithRelationInput | TranslationGlossaryEntryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TranslationGlossaryEntries.
     */
    cursor?: TranslationGlossaryEntryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TranslationGlossaryEntries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TranslationGlossaryEntries.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TranslationGlossaryEntries.
     */
    distinct?: TranslationGlossaryEntryScalarFieldEnum | TranslationGlossaryEntryScalarFieldEnum[]
  }

  /**
   * TranslationGlossaryEntry findMany
   */
  export type TranslationGlossaryEntryFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TranslationGlossaryEntry
     */
    select?: TranslationGlossaryEntrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the TranslationGlossaryEntry
     */
    omit?: TranslationGlossaryEntryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TranslationGlossaryEntryInclude<ExtArgs> | null
    /**
     * Filter, which TranslationGlossaryEntries to fetch.
     */
    where?: TranslationGlossaryEntryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TranslationGlossaryEntries to fetch.
     */
    orderBy?: TranslationGlossaryEntryOrderByWithRelationInput | TranslationGlossaryEntryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing TranslationGlossaryEntries.
     */
    cursor?: TranslationGlossaryEntryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TranslationGlossaryEntries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TranslationGlossaryEntries.
     */
    skip?: number
    distinct?: TranslationGlossaryEntryScalarFieldEnum | TranslationGlossaryEntryScalarFieldEnum[]
  }

  /**
   * TranslationGlossaryEntry create
   */
  export type TranslationGlossaryEntryCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TranslationGlossaryEntry
     */
    select?: TranslationGlossaryEntrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the TranslationGlossaryEntry
     */
    omit?: TranslationGlossaryEntryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TranslationGlossaryEntryInclude<ExtArgs> | null
    /**
     * The data needed to create a TranslationGlossaryEntry.
     */
    data: XOR<TranslationGlossaryEntryCreateInput, TranslationGlossaryEntryUncheckedCreateInput>
  }

  /**
   * TranslationGlossaryEntry createMany
   */
  export type TranslationGlossaryEntryCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many TranslationGlossaryEntries.
     */
    data: TranslationGlossaryEntryCreateManyInput | TranslationGlossaryEntryCreateManyInput[]
  }

  /**
   * TranslationGlossaryEntry createManyAndReturn
   */
  export type TranslationGlossaryEntryCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TranslationGlossaryEntry
     */
    select?: TranslationGlossaryEntrySelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the TranslationGlossaryEntry
     */
    omit?: TranslationGlossaryEntryOmit<ExtArgs> | null
    /**
     * The data used to create many TranslationGlossaryEntries.
     */
    data: TranslationGlossaryEntryCreateManyInput | TranslationGlossaryEntryCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TranslationGlossaryEntryIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * TranslationGlossaryEntry update
   */
  export type TranslationGlossaryEntryUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TranslationGlossaryEntry
     */
    select?: TranslationGlossaryEntrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the TranslationGlossaryEntry
     */
    omit?: TranslationGlossaryEntryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TranslationGlossaryEntryInclude<ExtArgs> | null
    /**
     * The data needed to update a TranslationGlossaryEntry.
     */
    data: XOR<TranslationGlossaryEntryUpdateInput, TranslationGlossaryEntryUncheckedUpdateInput>
    /**
     * Choose, which TranslationGlossaryEntry to update.
     */
    where: TranslationGlossaryEntryWhereUniqueInput
  }

  /**
   * TranslationGlossaryEntry updateMany
   */
  export type TranslationGlossaryEntryUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update TranslationGlossaryEntries.
     */
    data: XOR<TranslationGlossaryEntryUpdateManyMutationInput, TranslationGlossaryEntryUncheckedUpdateManyInput>
    /**
     * Filter which TranslationGlossaryEntries to update
     */
    where?: TranslationGlossaryEntryWhereInput
    /**
     * Limit how many TranslationGlossaryEntries to update.
     */
    limit?: number
  }

  /**
   * TranslationGlossaryEntry updateManyAndReturn
   */
  export type TranslationGlossaryEntryUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TranslationGlossaryEntry
     */
    select?: TranslationGlossaryEntrySelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the TranslationGlossaryEntry
     */
    omit?: TranslationGlossaryEntryOmit<ExtArgs> | null
    /**
     * The data used to update TranslationGlossaryEntries.
     */
    data: XOR<TranslationGlossaryEntryUpdateManyMutationInput, TranslationGlossaryEntryUncheckedUpdateManyInput>
    /**
     * Filter which TranslationGlossaryEntries to update
     */
    where?: TranslationGlossaryEntryWhereInput
    /**
     * Limit how many TranslationGlossaryEntries to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TranslationGlossaryEntryIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * TranslationGlossaryEntry upsert
   */
  export type TranslationGlossaryEntryUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TranslationGlossaryEntry
     */
    select?: TranslationGlossaryEntrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the TranslationGlossaryEntry
     */
    omit?: TranslationGlossaryEntryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TranslationGlossaryEntryInclude<ExtArgs> | null
    /**
     * The filter to search for the TranslationGlossaryEntry to update in case it exists.
     */
    where: TranslationGlossaryEntryWhereUniqueInput
    /**
     * In case the TranslationGlossaryEntry found by the `where` argument doesn't exist, create a new TranslationGlossaryEntry with this data.
     */
    create: XOR<TranslationGlossaryEntryCreateInput, TranslationGlossaryEntryUncheckedCreateInput>
    /**
     * In case the TranslationGlossaryEntry was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TranslationGlossaryEntryUpdateInput, TranslationGlossaryEntryUncheckedUpdateInput>
  }

  /**
   * TranslationGlossaryEntry delete
   */
  export type TranslationGlossaryEntryDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TranslationGlossaryEntry
     */
    select?: TranslationGlossaryEntrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the TranslationGlossaryEntry
     */
    omit?: TranslationGlossaryEntryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TranslationGlossaryEntryInclude<ExtArgs> | null
    /**
     * Filter which TranslationGlossaryEntry to delete.
     */
    where: TranslationGlossaryEntryWhereUniqueInput
  }

  /**
   * TranslationGlossaryEntry deleteMany
   */
  export type TranslationGlossaryEntryDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TranslationGlossaryEntries to delete
     */
    where?: TranslationGlossaryEntryWhereInput
    /**
     * Limit how many TranslationGlossaryEntries to delete.
     */
    limit?: number
  }

  /**
   * TranslationGlossaryEntry without action
   */
  export type TranslationGlossaryEntryDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TranslationGlossaryEntry
     */
    select?: TranslationGlossaryEntrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the TranslationGlossaryEntry
     */
    omit?: TranslationGlossaryEntryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TranslationGlossaryEntryInclude<ExtArgs> | null
  }


  /**
   * Model ChapterTranslation
   */

  export type AggregateChapterTranslation = {
    _count: ChapterTranslationCountAggregateOutputType | null
    _avg: ChapterTranslationAvgAggregateOutputType | null
    _sum: ChapterTranslationSumAggregateOutputType | null
    _min: ChapterTranslationMinAggregateOutputType | null
    _max: ChapterTranslationMaxAggregateOutputType | null
  }

  export type ChapterTranslationAvgAggregateOutputType = {
    retryCount: number | null
  }

  export type ChapterTranslationSumAggregateOutputType = {
    retryCount: number | null
  }

  export type ChapterTranslationMinAggregateOutputType = {
    id: string | null
    projectId: string | null
    chapterId: string | null
    sourceChecksum: string | null
    status: string | null
    currentPublishedVersionId: string | null
    latestGeneratedVersionId: string | null
    hasManualEdits: boolean | null
    newGeneratedAvailable: boolean | null
    staleReason: string | null
    lastError: string | null
    retryCount: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ChapterTranslationMaxAggregateOutputType = {
    id: string | null
    projectId: string | null
    chapterId: string | null
    sourceChecksum: string | null
    status: string | null
    currentPublishedVersionId: string | null
    latestGeneratedVersionId: string | null
    hasManualEdits: boolean | null
    newGeneratedAvailable: boolean | null
    staleReason: string | null
    lastError: string | null
    retryCount: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ChapterTranslationCountAggregateOutputType = {
    id: number
    projectId: number
    chapterId: number
    sourceChecksum: number
    status: number
    currentPublishedVersionId: number
    latestGeneratedVersionId: number
    hasManualEdits: number
    newGeneratedAvailable: number
    staleReason: number
    lastError: number
    retryCount: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type ChapterTranslationAvgAggregateInputType = {
    retryCount?: true
  }

  export type ChapterTranslationSumAggregateInputType = {
    retryCount?: true
  }

  export type ChapterTranslationMinAggregateInputType = {
    id?: true
    projectId?: true
    chapterId?: true
    sourceChecksum?: true
    status?: true
    currentPublishedVersionId?: true
    latestGeneratedVersionId?: true
    hasManualEdits?: true
    newGeneratedAvailable?: true
    staleReason?: true
    lastError?: true
    retryCount?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ChapterTranslationMaxAggregateInputType = {
    id?: true
    projectId?: true
    chapterId?: true
    sourceChecksum?: true
    status?: true
    currentPublishedVersionId?: true
    latestGeneratedVersionId?: true
    hasManualEdits?: true
    newGeneratedAvailable?: true
    staleReason?: true
    lastError?: true
    retryCount?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ChapterTranslationCountAggregateInputType = {
    id?: true
    projectId?: true
    chapterId?: true
    sourceChecksum?: true
    status?: true
    currentPublishedVersionId?: true
    latestGeneratedVersionId?: true
    hasManualEdits?: true
    newGeneratedAvailable?: true
    staleReason?: true
    lastError?: true
    retryCount?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type ChapterTranslationAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ChapterTranslation to aggregate.
     */
    where?: ChapterTranslationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ChapterTranslations to fetch.
     */
    orderBy?: ChapterTranslationOrderByWithRelationInput | ChapterTranslationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ChapterTranslationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ChapterTranslations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ChapterTranslations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ChapterTranslations
    **/
    _count?: true | ChapterTranslationCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ChapterTranslationAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ChapterTranslationSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ChapterTranslationMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ChapterTranslationMaxAggregateInputType
  }

  export type GetChapterTranslationAggregateType<T extends ChapterTranslationAggregateArgs> = {
        [P in keyof T & keyof AggregateChapterTranslation]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateChapterTranslation[P]>
      : GetScalarType<T[P], AggregateChapterTranslation[P]>
  }




  export type ChapterTranslationGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ChapterTranslationWhereInput
    orderBy?: ChapterTranslationOrderByWithAggregationInput | ChapterTranslationOrderByWithAggregationInput[]
    by: ChapterTranslationScalarFieldEnum[] | ChapterTranslationScalarFieldEnum
    having?: ChapterTranslationScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ChapterTranslationCountAggregateInputType | true
    _avg?: ChapterTranslationAvgAggregateInputType
    _sum?: ChapterTranslationSumAggregateInputType
    _min?: ChapterTranslationMinAggregateInputType
    _max?: ChapterTranslationMaxAggregateInputType
  }

  export type ChapterTranslationGroupByOutputType = {
    id: string
    projectId: string
    chapterId: string
    sourceChecksum: string
    status: string
    currentPublishedVersionId: string | null
    latestGeneratedVersionId: string | null
    hasManualEdits: boolean
    newGeneratedAvailable: boolean
    staleReason: string | null
    lastError: string | null
    retryCount: number
    createdAt: Date
    updatedAt: Date
    _count: ChapterTranslationCountAggregateOutputType | null
    _avg: ChapterTranslationAvgAggregateOutputType | null
    _sum: ChapterTranslationSumAggregateOutputType | null
    _min: ChapterTranslationMinAggregateOutputType | null
    _max: ChapterTranslationMaxAggregateOutputType | null
  }

  type GetChapterTranslationGroupByPayload<T extends ChapterTranslationGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ChapterTranslationGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ChapterTranslationGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ChapterTranslationGroupByOutputType[P]>
            : GetScalarType<T[P], ChapterTranslationGroupByOutputType[P]>
        }
      >
    >


  export type ChapterTranslationSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    projectId?: boolean
    chapterId?: boolean
    sourceChecksum?: boolean
    status?: boolean
    currentPublishedVersionId?: boolean
    latestGeneratedVersionId?: boolean
    hasManualEdits?: boolean
    newGeneratedAvailable?: boolean
    staleReason?: boolean
    lastError?: boolean
    retryCount?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    project?: boolean | TranslationProjectDefaultArgs<ExtArgs>
    chapter?: boolean | ChapterDefaultArgs<ExtArgs>
    versions?: boolean | ChapterTranslation$versionsArgs<ExtArgs>
    _count?: boolean | ChapterTranslationCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["chapterTranslation"]>

  export type ChapterTranslationSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    projectId?: boolean
    chapterId?: boolean
    sourceChecksum?: boolean
    status?: boolean
    currentPublishedVersionId?: boolean
    latestGeneratedVersionId?: boolean
    hasManualEdits?: boolean
    newGeneratedAvailable?: boolean
    staleReason?: boolean
    lastError?: boolean
    retryCount?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    project?: boolean | TranslationProjectDefaultArgs<ExtArgs>
    chapter?: boolean | ChapterDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["chapterTranslation"]>

  export type ChapterTranslationSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    projectId?: boolean
    chapterId?: boolean
    sourceChecksum?: boolean
    status?: boolean
    currentPublishedVersionId?: boolean
    latestGeneratedVersionId?: boolean
    hasManualEdits?: boolean
    newGeneratedAvailable?: boolean
    staleReason?: boolean
    lastError?: boolean
    retryCount?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    project?: boolean | TranslationProjectDefaultArgs<ExtArgs>
    chapter?: boolean | ChapterDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["chapterTranslation"]>

  export type ChapterTranslationSelectScalar = {
    id?: boolean
    projectId?: boolean
    chapterId?: boolean
    sourceChecksum?: boolean
    status?: boolean
    currentPublishedVersionId?: boolean
    latestGeneratedVersionId?: boolean
    hasManualEdits?: boolean
    newGeneratedAvailable?: boolean
    staleReason?: boolean
    lastError?: boolean
    retryCount?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type ChapterTranslationOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "projectId" | "chapterId" | "sourceChecksum" | "status" | "currentPublishedVersionId" | "latestGeneratedVersionId" | "hasManualEdits" | "newGeneratedAvailable" | "staleReason" | "lastError" | "retryCount" | "createdAt" | "updatedAt", ExtArgs["result"]["chapterTranslation"]>
  export type ChapterTranslationInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    project?: boolean | TranslationProjectDefaultArgs<ExtArgs>
    chapter?: boolean | ChapterDefaultArgs<ExtArgs>
    versions?: boolean | ChapterTranslation$versionsArgs<ExtArgs>
    _count?: boolean | ChapterTranslationCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type ChapterTranslationIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    project?: boolean | TranslationProjectDefaultArgs<ExtArgs>
    chapter?: boolean | ChapterDefaultArgs<ExtArgs>
  }
  export type ChapterTranslationIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    project?: boolean | TranslationProjectDefaultArgs<ExtArgs>
    chapter?: boolean | ChapterDefaultArgs<ExtArgs>
  }

  export type $ChapterTranslationPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ChapterTranslation"
    objects: {
      project: Prisma.$TranslationProjectPayload<ExtArgs>
      chapter: Prisma.$ChapterPayload<ExtArgs>
      versions: Prisma.$ChapterTranslationVersionPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      projectId: string
      chapterId: string
      sourceChecksum: string
      status: string
      currentPublishedVersionId: string | null
      latestGeneratedVersionId: string | null
      hasManualEdits: boolean
      newGeneratedAvailable: boolean
      staleReason: string | null
      lastError: string | null
      retryCount: number
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["chapterTranslation"]>
    composites: {}
  }

  type ChapterTranslationGetPayload<S extends boolean | null | undefined | ChapterTranslationDefaultArgs> = $Result.GetResult<Prisma.$ChapterTranslationPayload, S>

  type ChapterTranslationCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ChapterTranslationFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ChapterTranslationCountAggregateInputType | true
    }

  export interface ChapterTranslationDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ChapterTranslation'], meta: { name: 'ChapterTranslation' } }
    /**
     * Find zero or one ChapterTranslation that matches the filter.
     * @param {ChapterTranslationFindUniqueArgs} args - Arguments to find a ChapterTranslation
     * @example
     * // Get one ChapterTranslation
     * const chapterTranslation = await prisma.chapterTranslation.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ChapterTranslationFindUniqueArgs>(args: SelectSubset<T, ChapterTranslationFindUniqueArgs<ExtArgs>>): Prisma__ChapterTranslationClient<$Result.GetResult<Prisma.$ChapterTranslationPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one ChapterTranslation that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ChapterTranslationFindUniqueOrThrowArgs} args - Arguments to find a ChapterTranslation
     * @example
     * // Get one ChapterTranslation
     * const chapterTranslation = await prisma.chapterTranslation.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ChapterTranslationFindUniqueOrThrowArgs>(args: SelectSubset<T, ChapterTranslationFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ChapterTranslationClient<$Result.GetResult<Prisma.$ChapterTranslationPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ChapterTranslation that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChapterTranslationFindFirstArgs} args - Arguments to find a ChapterTranslation
     * @example
     * // Get one ChapterTranslation
     * const chapterTranslation = await prisma.chapterTranslation.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ChapterTranslationFindFirstArgs>(args?: SelectSubset<T, ChapterTranslationFindFirstArgs<ExtArgs>>): Prisma__ChapterTranslationClient<$Result.GetResult<Prisma.$ChapterTranslationPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ChapterTranslation that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChapterTranslationFindFirstOrThrowArgs} args - Arguments to find a ChapterTranslation
     * @example
     * // Get one ChapterTranslation
     * const chapterTranslation = await prisma.chapterTranslation.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ChapterTranslationFindFirstOrThrowArgs>(args?: SelectSubset<T, ChapterTranslationFindFirstOrThrowArgs<ExtArgs>>): Prisma__ChapterTranslationClient<$Result.GetResult<Prisma.$ChapterTranslationPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more ChapterTranslations that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChapterTranslationFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ChapterTranslations
     * const chapterTranslations = await prisma.chapterTranslation.findMany()
     * 
     * // Get first 10 ChapterTranslations
     * const chapterTranslations = await prisma.chapterTranslation.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const chapterTranslationWithIdOnly = await prisma.chapterTranslation.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ChapterTranslationFindManyArgs>(args?: SelectSubset<T, ChapterTranslationFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ChapterTranslationPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a ChapterTranslation.
     * @param {ChapterTranslationCreateArgs} args - Arguments to create a ChapterTranslation.
     * @example
     * // Create one ChapterTranslation
     * const ChapterTranslation = await prisma.chapterTranslation.create({
     *   data: {
     *     // ... data to create a ChapterTranslation
     *   }
     * })
     * 
     */
    create<T extends ChapterTranslationCreateArgs>(args: SelectSubset<T, ChapterTranslationCreateArgs<ExtArgs>>): Prisma__ChapterTranslationClient<$Result.GetResult<Prisma.$ChapterTranslationPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many ChapterTranslations.
     * @param {ChapterTranslationCreateManyArgs} args - Arguments to create many ChapterTranslations.
     * @example
     * // Create many ChapterTranslations
     * const chapterTranslation = await prisma.chapterTranslation.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ChapterTranslationCreateManyArgs>(args?: SelectSubset<T, ChapterTranslationCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ChapterTranslations and returns the data saved in the database.
     * @param {ChapterTranslationCreateManyAndReturnArgs} args - Arguments to create many ChapterTranslations.
     * @example
     * // Create many ChapterTranslations
     * const chapterTranslation = await prisma.chapterTranslation.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ChapterTranslations and only return the `id`
     * const chapterTranslationWithIdOnly = await prisma.chapterTranslation.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ChapterTranslationCreateManyAndReturnArgs>(args?: SelectSubset<T, ChapterTranslationCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ChapterTranslationPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a ChapterTranslation.
     * @param {ChapterTranslationDeleteArgs} args - Arguments to delete one ChapterTranslation.
     * @example
     * // Delete one ChapterTranslation
     * const ChapterTranslation = await prisma.chapterTranslation.delete({
     *   where: {
     *     // ... filter to delete one ChapterTranslation
     *   }
     * })
     * 
     */
    delete<T extends ChapterTranslationDeleteArgs>(args: SelectSubset<T, ChapterTranslationDeleteArgs<ExtArgs>>): Prisma__ChapterTranslationClient<$Result.GetResult<Prisma.$ChapterTranslationPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one ChapterTranslation.
     * @param {ChapterTranslationUpdateArgs} args - Arguments to update one ChapterTranslation.
     * @example
     * // Update one ChapterTranslation
     * const chapterTranslation = await prisma.chapterTranslation.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ChapterTranslationUpdateArgs>(args: SelectSubset<T, ChapterTranslationUpdateArgs<ExtArgs>>): Prisma__ChapterTranslationClient<$Result.GetResult<Prisma.$ChapterTranslationPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more ChapterTranslations.
     * @param {ChapterTranslationDeleteManyArgs} args - Arguments to filter ChapterTranslations to delete.
     * @example
     * // Delete a few ChapterTranslations
     * const { count } = await prisma.chapterTranslation.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ChapterTranslationDeleteManyArgs>(args?: SelectSubset<T, ChapterTranslationDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ChapterTranslations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChapterTranslationUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ChapterTranslations
     * const chapterTranslation = await prisma.chapterTranslation.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ChapterTranslationUpdateManyArgs>(args: SelectSubset<T, ChapterTranslationUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ChapterTranslations and returns the data updated in the database.
     * @param {ChapterTranslationUpdateManyAndReturnArgs} args - Arguments to update many ChapterTranslations.
     * @example
     * // Update many ChapterTranslations
     * const chapterTranslation = await prisma.chapterTranslation.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more ChapterTranslations and only return the `id`
     * const chapterTranslationWithIdOnly = await prisma.chapterTranslation.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ChapterTranslationUpdateManyAndReturnArgs>(args: SelectSubset<T, ChapterTranslationUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ChapterTranslationPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one ChapterTranslation.
     * @param {ChapterTranslationUpsertArgs} args - Arguments to update or create a ChapterTranslation.
     * @example
     * // Update or create a ChapterTranslation
     * const chapterTranslation = await prisma.chapterTranslation.upsert({
     *   create: {
     *     // ... data to create a ChapterTranslation
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ChapterTranslation we want to update
     *   }
     * })
     */
    upsert<T extends ChapterTranslationUpsertArgs>(args: SelectSubset<T, ChapterTranslationUpsertArgs<ExtArgs>>): Prisma__ChapterTranslationClient<$Result.GetResult<Prisma.$ChapterTranslationPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of ChapterTranslations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChapterTranslationCountArgs} args - Arguments to filter ChapterTranslations to count.
     * @example
     * // Count the number of ChapterTranslations
     * const count = await prisma.chapterTranslation.count({
     *   where: {
     *     // ... the filter for the ChapterTranslations we want to count
     *   }
     * })
    **/
    count<T extends ChapterTranslationCountArgs>(
      args?: Subset<T, ChapterTranslationCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ChapterTranslationCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ChapterTranslation.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChapterTranslationAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ChapterTranslationAggregateArgs>(args: Subset<T, ChapterTranslationAggregateArgs>): Prisma.PrismaPromise<GetChapterTranslationAggregateType<T>>

    /**
     * Group by ChapterTranslation.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChapterTranslationGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ChapterTranslationGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ChapterTranslationGroupByArgs['orderBy'] }
        : { orderBy?: ChapterTranslationGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ChapterTranslationGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetChapterTranslationGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ChapterTranslation model
   */
  readonly fields: ChapterTranslationFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ChapterTranslation.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ChapterTranslationClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    project<T extends TranslationProjectDefaultArgs<ExtArgs> = {}>(args?: Subset<T, TranslationProjectDefaultArgs<ExtArgs>>): Prisma__TranslationProjectClient<$Result.GetResult<Prisma.$TranslationProjectPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    chapter<T extends ChapterDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ChapterDefaultArgs<ExtArgs>>): Prisma__ChapterClient<$Result.GetResult<Prisma.$ChapterPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    versions<T extends ChapterTranslation$versionsArgs<ExtArgs> = {}>(args?: Subset<T, ChapterTranslation$versionsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ChapterTranslationVersionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the ChapterTranslation model
   */
  interface ChapterTranslationFieldRefs {
    readonly id: FieldRef<"ChapterTranslation", 'String'>
    readonly projectId: FieldRef<"ChapterTranslation", 'String'>
    readonly chapterId: FieldRef<"ChapterTranslation", 'String'>
    readonly sourceChecksum: FieldRef<"ChapterTranslation", 'String'>
    readonly status: FieldRef<"ChapterTranslation", 'String'>
    readonly currentPublishedVersionId: FieldRef<"ChapterTranslation", 'String'>
    readonly latestGeneratedVersionId: FieldRef<"ChapterTranslation", 'String'>
    readonly hasManualEdits: FieldRef<"ChapterTranslation", 'Boolean'>
    readonly newGeneratedAvailable: FieldRef<"ChapterTranslation", 'Boolean'>
    readonly staleReason: FieldRef<"ChapterTranslation", 'String'>
    readonly lastError: FieldRef<"ChapterTranslation", 'String'>
    readonly retryCount: FieldRef<"ChapterTranslation", 'Int'>
    readonly createdAt: FieldRef<"ChapterTranslation", 'DateTime'>
    readonly updatedAt: FieldRef<"ChapterTranslation", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * ChapterTranslation findUnique
   */
  export type ChapterTranslationFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChapterTranslation
     */
    select?: ChapterTranslationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ChapterTranslation
     */
    omit?: ChapterTranslationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChapterTranslationInclude<ExtArgs> | null
    /**
     * Filter, which ChapterTranslation to fetch.
     */
    where: ChapterTranslationWhereUniqueInput
  }

  /**
   * ChapterTranslation findUniqueOrThrow
   */
  export type ChapterTranslationFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChapterTranslation
     */
    select?: ChapterTranslationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ChapterTranslation
     */
    omit?: ChapterTranslationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChapterTranslationInclude<ExtArgs> | null
    /**
     * Filter, which ChapterTranslation to fetch.
     */
    where: ChapterTranslationWhereUniqueInput
  }

  /**
   * ChapterTranslation findFirst
   */
  export type ChapterTranslationFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChapterTranslation
     */
    select?: ChapterTranslationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ChapterTranslation
     */
    omit?: ChapterTranslationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChapterTranslationInclude<ExtArgs> | null
    /**
     * Filter, which ChapterTranslation to fetch.
     */
    where?: ChapterTranslationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ChapterTranslations to fetch.
     */
    orderBy?: ChapterTranslationOrderByWithRelationInput | ChapterTranslationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ChapterTranslations.
     */
    cursor?: ChapterTranslationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ChapterTranslations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ChapterTranslations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ChapterTranslations.
     */
    distinct?: ChapterTranslationScalarFieldEnum | ChapterTranslationScalarFieldEnum[]
  }

  /**
   * ChapterTranslation findFirstOrThrow
   */
  export type ChapterTranslationFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChapterTranslation
     */
    select?: ChapterTranslationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ChapterTranslation
     */
    omit?: ChapterTranslationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChapterTranslationInclude<ExtArgs> | null
    /**
     * Filter, which ChapterTranslation to fetch.
     */
    where?: ChapterTranslationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ChapterTranslations to fetch.
     */
    orderBy?: ChapterTranslationOrderByWithRelationInput | ChapterTranslationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ChapterTranslations.
     */
    cursor?: ChapterTranslationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ChapterTranslations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ChapterTranslations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ChapterTranslations.
     */
    distinct?: ChapterTranslationScalarFieldEnum | ChapterTranslationScalarFieldEnum[]
  }

  /**
   * ChapterTranslation findMany
   */
  export type ChapterTranslationFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChapterTranslation
     */
    select?: ChapterTranslationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ChapterTranslation
     */
    omit?: ChapterTranslationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChapterTranslationInclude<ExtArgs> | null
    /**
     * Filter, which ChapterTranslations to fetch.
     */
    where?: ChapterTranslationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ChapterTranslations to fetch.
     */
    orderBy?: ChapterTranslationOrderByWithRelationInput | ChapterTranslationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ChapterTranslations.
     */
    cursor?: ChapterTranslationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ChapterTranslations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ChapterTranslations.
     */
    skip?: number
    distinct?: ChapterTranslationScalarFieldEnum | ChapterTranslationScalarFieldEnum[]
  }

  /**
   * ChapterTranslation create
   */
  export type ChapterTranslationCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChapterTranslation
     */
    select?: ChapterTranslationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ChapterTranslation
     */
    omit?: ChapterTranslationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChapterTranslationInclude<ExtArgs> | null
    /**
     * The data needed to create a ChapterTranslation.
     */
    data: XOR<ChapterTranslationCreateInput, ChapterTranslationUncheckedCreateInput>
  }

  /**
   * ChapterTranslation createMany
   */
  export type ChapterTranslationCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ChapterTranslations.
     */
    data: ChapterTranslationCreateManyInput | ChapterTranslationCreateManyInput[]
  }

  /**
   * ChapterTranslation createManyAndReturn
   */
  export type ChapterTranslationCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChapterTranslation
     */
    select?: ChapterTranslationSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ChapterTranslation
     */
    omit?: ChapterTranslationOmit<ExtArgs> | null
    /**
     * The data used to create many ChapterTranslations.
     */
    data: ChapterTranslationCreateManyInput | ChapterTranslationCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChapterTranslationIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * ChapterTranslation update
   */
  export type ChapterTranslationUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChapterTranslation
     */
    select?: ChapterTranslationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ChapterTranslation
     */
    omit?: ChapterTranslationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChapterTranslationInclude<ExtArgs> | null
    /**
     * The data needed to update a ChapterTranslation.
     */
    data: XOR<ChapterTranslationUpdateInput, ChapterTranslationUncheckedUpdateInput>
    /**
     * Choose, which ChapterTranslation to update.
     */
    where: ChapterTranslationWhereUniqueInput
  }

  /**
   * ChapterTranslation updateMany
   */
  export type ChapterTranslationUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ChapterTranslations.
     */
    data: XOR<ChapterTranslationUpdateManyMutationInput, ChapterTranslationUncheckedUpdateManyInput>
    /**
     * Filter which ChapterTranslations to update
     */
    where?: ChapterTranslationWhereInput
    /**
     * Limit how many ChapterTranslations to update.
     */
    limit?: number
  }

  /**
   * ChapterTranslation updateManyAndReturn
   */
  export type ChapterTranslationUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChapterTranslation
     */
    select?: ChapterTranslationSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ChapterTranslation
     */
    omit?: ChapterTranslationOmit<ExtArgs> | null
    /**
     * The data used to update ChapterTranslations.
     */
    data: XOR<ChapterTranslationUpdateManyMutationInput, ChapterTranslationUncheckedUpdateManyInput>
    /**
     * Filter which ChapterTranslations to update
     */
    where?: ChapterTranslationWhereInput
    /**
     * Limit how many ChapterTranslations to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChapterTranslationIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * ChapterTranslation upsert
   */
  export type ChapterTranslationUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChapterTranslation
     */
    select?: ChapterTranslationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ChapterTranslation
     */
    omit?: ChapterTranslationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChapterTranslationInclude<ExtArgs> | null
    /**
     * The filter to search for the ChapterTranslation to update in case it exists.
     */
    where: ChapterTranslationWhereUniqueInput
    /**
     * In case the ChapterTranslation found by the `where` argument doesn't exist, create a new ChapterTranslation with this data.
     */
    create: XOR<ChapterTranslationCreateInput, ChapterTranslationUncheckedCreateInput>
    /**
     * In case the ChapterTranslation was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ChapterTranslationUpdateInput, ChapterTranslationUncheckedUpdateInput>
  }

  /**
   * ChapterTranslation delete
   */
  export type ChapterTranslationDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChapterTranslation
     */
    select?: ChapterTranslationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ChapterTranslation
     */
    omit?: ChapterTranslationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChapterTranslationInclude<ExtArgs> | null
    /**
     * Filter which ChapterTranslation to delete.
     */
    where: ChapterTranslationWhereUniqueInput
  }

  /**
   * ChapterTranslation deleteMany
   */
  export type ChapterTranslationDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ChapterTranslations to delete
     */
    where?: ChapterTranslationWhereInput
    /**
     * Limit how many ChapterTranslations to delete.
     */
    limit?: number
  }

  /**
   * ChapterTranslation.versions
   */
  export type ChapterTranslation$versionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChapterTranslationVersion
     */
    select?: ChapterTranslationVersionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ChapterTranslationVersion
     */
    omit?: ChapterTranslationVersionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChapterTranslationVersionInclude<ExtArgs> | null
    where?: ChapterTranslationVersionWhereInput
    orderBy?: ChapterTranslationVersionOrderByWithRelationInput | ChapterTranslationVersionOrderByWithRelationInput[]
    cursor?: ChapterTranslationVersionWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ChapterTranslationVersionScalarFieldEnum | ChapterTranslationVersionScalarFieldEnum[]
  }

  /**
   * ChapterTranslation without action
   */
  export type ChapterTranslationDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChapterTranslation
     */
    select?: ChapterTranslationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ChapterTranslation
     */
    omit?: ChapterTranslationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChapterTranslationInclude<ExtArgs> | null
  }


  /**
   * Model ChapterTranslationVersion
   */

  export type AggregateChapterTranslationVersion = {
    _count: ChapterTranslationVersionCountAggregateOutputType | null
    _avg: ChapterTranslationVersionAvgAggregateOutputType | null
    _sum: ChapterTranslationVersionSumAggregateOutputType | null
    _min: ChapterTranslationVersionMinAggregateOutputType | null
    _max: ChapterTranslationVersionMaxAggregateOutputType | null
  }

  export type ChapterTranslationVersionAvgAggregateOutputType = {
    versionNumber: number | null
    glossaryVersion: number | null
  }

  export type ChapterTranslationVersionSumAggregateOutputType = {
    versionNumber: number | null
    glossaryVersion: number | null
  }

  export type ChapterTranslationVersionMinAggregateOutputType = {
    id: string | null
    chapterTranslationId: string | null
    versionNumber: number | null
    kind: string | null
    title: string | null
    htmlPath: string | null
    textPath: string | null
    summary: string | null
    provider: string | null
    model: string | null
    promptSnapshot: string | null
    glossaryVersion: number | null
    sourceChecksum: string | null
    isPublished: boolean | null
    createdBy: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ChapterTranslationVersionMaxAggregateOutputType = {
    id: string | null
    chapterTranslationId: string | null
    versionNumber: number | null
    kind: string | null
    title: string | null
    htmlPath: string | null
    textPath: string | null
    summary: string | null
    provider: string | null
    model: string | null
    promptSnapshot: string | null
    glossaryVersion: number | null
    sourceChecksum: string | null
    isPublished: boolean | null
    createdBy: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ChapterTranslationVersionCountAggregateOutputType = {
    id: number
    chapterTranslationId: number
    versionNumber: number
    kind: number
    title: number
    htmlPath: number
    textPath: number
    summary: number
    provider: number
    model: number
    promptSnapshot: number
    glossaryVersion: number
    sourceChecksum: number
    isPublished: number
    createdBy: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type ChapterTranslationVersionAvgAggregateInputType = {
    versionNumber?: true
    glossaryVersion?: true
  }

  export type ChapterTranslationVersionSumAggregateInputType = {
    versionNumber?: true
    glossaryVersion?: true
  }

  export type ChapterTranslationVersionMinAggregateInputType = {
    id?: true
    chapterTranslationId?: true
    versionNumber?: true
    kind?: true
    title?: true
    htmlPath?: true
    textPath?: true
    summary?: true
    provider?: true
    model?: true
    promptSnapshot?: true
    glossaryVersion?: true
    sourceChecksum?: true
    isPublished?: true
    createdBy?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ChapterTranslationVersionMaxAggregateInputType = {
    id?: true
    chapterTranslationId?: true
    versionNumber?: true
    kind?: true
    title?: true
    htmlPath?: true
    textPath?: true
    summary?: true
    provider?: true
    model?: true
    promptSnapshot?: true
    glossaryVersion?: true
    sourceChecksum?: true
    isPublished?: true
    createdBy?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ChapterTranslationVersionCountAggregateInputType = {
    id?: true
    chapterTranslationId?: true
    versionNumber?: true
    kind?: true
    title?: true
    htmlPath?: true
    textPath?: true
    summary?: true
    provider?: true
    model?: true
    promptSnapshot?: true
    glossaryVersion?: true
    sourceChecksum?: true
    isPublished?: true
    createdBy?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type ChapterTranslationVersionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ChapterTranslationVersion to aggregate.
     */
    where?: ChapterTranslationVersionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ChapterTranslationVersions to fetch.
     */
    orderBy?: ChapterTranslationVersionOrderByWithRelationInput | ChapterTranslationVersionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ChapterTranslationVersionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ChapterTranslationVersions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ChapterTranslationVersions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ChapterTranslationVersions
    **/
    _count?: true | ChapterTranslationVersionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ChapterTranslationVersionAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ChapterTranslationVersionSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ChapterTranslationVersionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ChapterTranslationVersionMaxAggregateInputType
  }

  export type GetChapterTranslationVersionAggregateType<T extends ChapterTranslationVersionAggregateArgs> = {
        [P in keyof T & keyof AggregateChapterTranslationVersion]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateChapterTranslationVersion[P]>
      : GetScalarType<T[P], AggregateChapterTranslationVersion[P]>
  }




  export type ChapterTranslationVersionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ChapterTranslationVersionWhereInput
    orderBy?: ChapterTranslationVersionOrderByWithAggregationInput | ChapterTranslationVersionOrderByWithAggregationInput[]
    by: ChapterTranslationVersionScalarFieldEnum[] | ChapterTranslationVersionScalarFieldEnum
    having?: ChapterTranslationVersionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ChapterTranslationVersionCountAggregateInputType | true
    _avg?: ChapterTranslationVersionAvgAggregateInputType
    _sum?: ChapterTranslationVersionSumAggregateInputType
    _min?: ChapterTranslationVersionMinAggregateInputType
    _max?: ChapterTranslationVersionMaxAggregateInputType
  }

  export type ChapterTranslationVersionGroupByOutputType = {
    id: string
    chapterTranslationId: string
    versionNumber: number
    kind: string
    title: string | null
    htmlPath: string
    textPath: string | null
    summary: string | null
    provider: string | null
    model: string | null
    promptSnapshot: string | null
    glossaryVersion: number | null
    sourceChecksum: string
    isPublished: boolean
    createdBy: string
    createdAt: Date
    updatedAt: Date
    _count: ChapterTranslationVersionCountAggregateOutputType | null
    _avg: ChapterTranslationVersionAvgAggregateOutputType | null
    _sum: ChapterTranslationVersionSumAggregateOutputType | null
    _min: ChapterTranslationVersionMinAggregateOutputType | null
    _max: ChapterTranslationVersionMaxAggregateOutputType | null
  }

  type GetChapterTranslationVersionGroupByPayload<T extends ChapterTranslationVersionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ChapterTranslationVersionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ChapterTranslationVersionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ChapterTranslationVersionGroupByOutputType[P]>
            : GetScalarType<T[P], ChapterTranslationVersionGroupByOutputType[P]>
        }
      >
    >


  export type ChapterTranslationVersionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    chapterTranslationId?: boolean
    versionNumber?: boolean
    kind?: boolean
    title?: boolean
    htmlPath?: boolean
    textPath?: boolean
    summary?: boolean
    provider?: boolean
    model?: boolean
    promptSnapshot?: boolean
    glossaryVersion?: boolean
    sourceChecksum?: boolean
    isPublished?: boolean
    createdBy?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    chapterTranslation?: boolean | ChapterTranslationDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["chapterTranslationVersion"]>

  export type ChapterTranslationVersionSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    chapterTranslationId?: boolean
    versionNumber?: boolean
    kind?: boolean
    title?: boolean
    htmlPath?: boolean
    textPath?: boolean
    summary?: boolean
    provider?: boolean
    model?: boolean
    promptSnapshot?: boolean
    glossaryVersion?: boolean
    sourceChecksum?: boolean
    isPublished?: boolean
    createdBy?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    chapterTranslation?: boolean | ChapterTranslationDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["chapterTranslationVersion"]>

  export type ChapterTranslationVersionSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    chapterTranslationId?: boolean
    versionNumber?: boolean
    kind?: boolean
    title?: boolean
    htmlPath?: boolean
    textPath?: boolean
    summary?: boolean
    provider?: boolean
    model?: boolean
    promptSnapshot?: boolean
    glossaryVersion?: boolean
    sourceChecksum?: boolean
    isPublished?: boolean
    createdBy?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    chapterTranslation?: boolean | ChapterTranslationDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["chapterTranslationVersion"]>

  export type ChapterTranslationVersionSelectScalar = {
    id?: boolean
    chapterTranslationId?: boolean
    versionNumber?: boolean
    kind?: boolean
    title?: boolean
    htmlPath?: boolean
    textPath?: boolean
    summary?: boolean
    provider?: boolean
    model?: boolean
    promptSnapshot?: boolean
    glossaryVersion?: boolean
    sourceChecksum?: boolean
    isPublished?: boolean
    createdBy?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type ChapterTranslationVersionOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "chapterTranslationId" | "versionNumber" | "kind" | "title" | "htmlPath" | "textPath" | "summary" | "provider" | "model" | "promptSnapshot" | "glossaryVersion" | "sourceChecksum" | "isPublished" | "createdBy" | "createdAt" | "updatedAt", ExtArgs["result"]["chapterTranslationVersion"]>
  export type ChapterTranslationVersionInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    chapterTranslation?: boolean | ChapterTranslationDefaultArgs<ExtArgs>
  }
  export type ChapterTranslationVersionIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    chapterTranslation?: boolean | ChapterTranslationDefaultArgs<ExtArgs>
  }
  export type ChapterTranslationVersionIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    chapterTranslation?: boolean | ChapterTranslationDefaultArgs<ExtArgs>
  }

  export type $ChapterTranslationVersionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ChapterTranslationVersion"
    objects: {
      chapterTranslation: Prisma.$ChapterTranslationPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      chapterTranslationId: string
      versionNumber: number
      kind: string
      title: string | null
      htmlPath: string
      textPath: string | null
      summary: string | null
      provider: string | null
      model: string | null
      promptSnapshot: string | null
      glossaryVersion: number | null
      sourceChecksum: string
      isPublished: boolean
      createdBy: string
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["chapterTranslationVersion"]>
    composites: {}
  }

  type ChapterTranslationVersionGetPayload<S extends boolean | null | undefined | ChapterTranslationVersionDefaultArgs> = $Result.GetResult<Prisma.$ChapterTranslationVersionPayload, S>

  type ChapterTranslationVersionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ChapterTranslationVersionFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ChapterTranslationVersionCountAggregateInputType | true
    }

  export interface ChapterTranslationVersionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ChapterTranslationVersion'], meta: { name: 'ChapterTranslationVersion' } }
    /**
     * Find zero or one ChapterTranslationVersion that matches the filter.
     * @param {ChapterTranslationVersionFindUniqueArgs} args - Arguments to find a ChapterTranslationVersion
     * @example
     * // Get one ChapterTranslationVersion
     * const chapterTranslationVersion = await prisma.chapterTranslationVersion.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ChapterTranslationVersionFindUniqueArgs>(args: SelectSubset<T, ChapterTranslationVersionFindUniqueArgs<ExtArgs>>): Prisma__ChapterTranslationVersionClient<$Result.GetResult<Prisma.$ChapterTranslationVersionPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one ChapterTranslationVersion that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ChapterTranslationVersionFindUniqueOrThrowArgs} args - Arguments to find a ChapterTranslationVersion
     * @example
     * // Get one ChapterTranslationVersion
     * const chapterTranslationVersion = await prisma.chapterTranslationVersion.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ChapterTranslationVersionFindUniqueOrThrowArgs>(args: SelectSubset<T, ChapterTranslationVersionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ChapterTranslationVersionClient<$Result.GetResult<Prisma.$ChapterTranslationVersionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ChapterTranslationVersion that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChapterTranslationVersionFindFirstArgs} args - Arguments to find a ChapterTranslationVersion
     * @example
     * // Get one ChapterTranslationVersion
     * const chapterTranslationVersion = await prisma.chapterTranslationVersion.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ChapterTranslationVersionFindFirstArgs>(args?: SelectSubset<T, ChapterTranslationVersionFindFirstArgs<ExtArgs>>): Prisma__ChapterTranslationVersionClient<$Result.GetResult<Prisma.$ChapterTranslationVersionPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ChapterTranslationVersion that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChapterTranslationVersionFindFirstOrThrowArgs} args - Arguments to find a ChapterTranslationVersion
     * @example
     * // Get one ChapterTranslationVersion
     * const chapterTranslationVersion = await prisma.chapterTranslationVersion.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ChapterTranslationVersionFindFirstOrThrowArgs>(args?: SelectSubset<T, ChapterTranslationVersionFindFirstOrThrowArgs<ExtArgs>>): Prisma__ChapterTranslationVersionClient<$Result.GetResult<Prisma.$ChapterTranslationVersionPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more ChapterTranslationVersions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChapterTranslationVersionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ChapterTranslationVersions
     * const chapterTranslationVersions = await prisma.chapterTranslationVersion.findMany()
     * 
     * // Get first 10 ChapterTranslationVersions
     * const chapterTranslationVersions = await prisma.chapterTranslationVersion.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const chapterTranslationVersionWithIdOnly = await prisma.chapterTranslationVersion.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ChapterTranslationVersionFindManyArgs>(args?: SelectSubset<T, ChapterTranslationVersionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ChapterTranslationVersionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a ChapterTranslationVersion.
     * @param {ChapterTranslationVersionCreateArgs} args - Arguments to create a ChapterTranslationVersion.
     * @example
     * // Create one ChapterTranslationVersion
     * const ChapterTranslationVersion = await prisma.chapterTranslationVersion.create({
     *   data: {
     *     // ... data to create a ChapterTranslationVersion
     *   }
     * })
     * 
     */
    create<T extends ChapterTranslationVersionCreateArgs>(args: SelectSubset<T, ChapterTranslationVersionCreateArgs<ExtArgs>>): Prisma__ChapterTranslationVersionClient<$Result.GetResult<Prisma.$ChapterTranslationVersionPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many ChapterTranslationVersions.
     * @param {ChapterTranslationVersionCreateManyArgs} args - Arguments to create many ChapterTranslationVersions.
     * @example
     * // Create many ChapterTranslationVersions
     * const chapterTranslationVersion = await prisma.chapterTranslationVersion.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ChapterTranslationVersionCreateManyArgs>(args?: SelectSubset<T, ChapterTranslationVersionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ChapterTranslationVersions and returns the data saved in the database.
     * @param {ChapterTranslationVersionCreateManyAndReturnArgs} args - Arguments to create many ChapterTranslationVersions.
     * @example
     * // Create many ChapterTranslationVersions
     * const chapterTranslationVersion = await prisma.chapterTranslationVersion.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ChapterTranslationVersions and only return the `id`
     * const chapterTranslationVersionWithIdOnly = await prisma.chapterTranslationVersion.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ChapterTranslationVersionCreateManyAndReturnArgs>(args?: SelectSubset<T, ChapterTranslationVersionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ChapterTranslationVersionPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a ChapterTranslationVersion.
     * @param {ChapterTranslationVersionDeleteArgs} args - Arguments to delete one ChapterTranslationVersion.
     * @example
     * // Delete one ChapterTranslationVersion
     * const ChapterTranslationVersion = await prisma.chapterTranslationVersion.delete({
     *   where: {
     *     // ... filter to delete one ChapterTranslationVersion
     *   }
     * })
     * 
     */
    delete<T extends ChapterTranslationVersionDeleteArgs>(args: SelectSubset<T, ChapterTranslationVersionDeleteArgs<ExtArgs>>): Prisma__ChapterTranslationVersionClient<$Result.GetResult<Prisma.$ChapterTranslationVersionPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one ChapterTranslationVersion.
     * @param {ChapterTranslationVersionUpdateArgs} args - Arguments to update one ChapterTranslationVersion.
     * @example
     * // Update one ChapterTranslationVersion
     * const chapterTranslationVersion = await prisma.chapterTranslationVersion.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ChapterTranslationVersionUpdateArgs>(args: SelectSubset<T, ChapterTranslationVersionUpdateArgs<ExtArgs>>): Prisma__ChapterTranslationVersionClient<$Result.GetResult<Prisma.$ChapterTranslationVersionPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more ChapterTranslationVersions.
     * @param {ChapterTranslationVersionDeleteManyArgs} args - Arguments to filter ChapterTranslationVersions to delete.
     * @example
     * // Delete a few ChapterTranslationVersions
     * const { count } = await prisma.chapterTranslationVersion.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ChapterTranslationVersionDeleteManyArgs>(args?: SelectSubset<T, ChapterTranslationVersionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ChapterTranslationVersions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChapterTranslationVersionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ChapterTranslationVersions
     * const chapterTranslationVersion = await prisma.chapterTranslationVersion.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ChapterTranslationVersionUpdateManyArgs>(args: SelectSubset<T, ChapterTranslationVersionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ChapterTranslationVersions and returns the data updated in the database.
     * @param {ChapterTranslationVersionUpdateManyAndReturnArgs} args - Arguments to update many ChapterTranslationVersions.
     * @example
     * // Update many ChapterTranslationVersions
     * const chapterTranslationVersion = await prisma.chapterTranslationVersion.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more ChapterTranslationVersions and only return the `id`
     * const chapterTranslationVersionWithIdOnly = await prisma.chapterTranslationVersion.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ChapterTranslationVersionUpdateManyAndReturnArgs>(args: SelectSubset<T, ChapterTranslationVersionUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ChapterTranslationVersionPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one ChapterTranslationVersion.
     * @param {ChapterTranslationVersionUpsertArgs} args - Arguments to update or create a ChapterTranslationVersion.
     * @example
     * // Update or create a ChapterTranslationVersion
     * const chapterTranslationVersion = await prisma.chapterTranslationVersion.upsert({
     *   create: {
     *     // ... data to create a ChapterTranslationVersion
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ChapterTranslationVersion we want to update
     *   }
     * })
     */
    upsert<T extends ChapterTranslationVersionUpsertArgs>(args: SelectSubset<T, ChapterTranslationVersionUpsertArgs<ExtArgs>>): Prisma__ChapterTranslationVersionClient<$Result.GetResult<Prisma.$ChapterTranslationVersionPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of ChapterTranslationVersions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChapterTranslationVersionCountArgs} args - Arguments to filter ChapterTranslationVersions to count.
     * @example
     * // Count the number of ChapterTranslationVersions
     * const count = await prisma.chapterTranslationVersion.count({
     *   where: {
     *     // ... the filter for the ChapterTranslationVersions we want to count
     *   }
     * })
    **/
    count<T extends ChapterTranslationVersionCountArgs>(
      args?: Subset<T, ChapterTranslationVersionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ChapterTranslationVersionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ChapterTranslationVersion.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChapterTranslationVersionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ChapterTranslationVersionAggregateArgs>(args: Subset<T, ChapterTranslationVersionAggregateArgs>): Prisma.PrismaPromise<GetChapterTranslationVersionAggregateType<T>>

    /**
     * Group by ChapterTranslationVersion.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChapterTranslationVersionGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ChapterTranslationVersionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ChapterTranslationVersionGroupByArgs['orderBy'] }
        : { orderBy?: ChapterTranslationVersionGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ChapterTranslationVersionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetChapterTranslationVersionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ChapterTranslationVersion model
   */
  readonly fields: ChapterTranslationVersionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ChapterTranslationVersion.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ChapterTranslationVersionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    chapterTranslation<T extends ChapterTranslationDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ChapterTranslationDefaultArgs<ExtArgs>>): Prisma__ChapterTranslationClient<$Result.GetResult<Prisma.$ChapterTranslationPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the ChapterTranslationVersion model
   */
  interface ChapterTranslationVersionFieldRefs {
    readonly id: FieldRef<"ChapterTranslationVersion", 'String'>
    readonly chapterTranslationId: FieldRef<"ChapterTranslationVersion", 'String'>
    readonly versionNumber: FieldRef<"ChapterTranslationVersion", 'Int'>
    readonly kind: FieldRef<"ChapterTranslationVersion", 'String'>
    readonly title: FieldRef<"ChapterTranslationVersion", 'String'>
    readonly htmlPath: FieldRef<"ChapterTranslationVersion", 'String'>
    readonly textPath: FieldRef<"ChapterTranslationVersion", 'String'>
    readonly summary: FieldRef<"ChapterTranslationVersion", 'String'>
    readonly provider: FieldRef<"ChapterTranslationVersion", 'String'>
    readonly model: FieldRef<"ChapterTranslationVersion", 'String'>
    readonly promptSnapshot: FieldRef<"ChapterTranslationVersion", 'String'>
    readonly glossaryVersion: FieldRef<"ChapterTranslationVersion", 'Int'>
    readonly sourceChecksum: FieldRef<"ChapterTranslationVersion", 'String'>
    readonly isPublished: FieldRef<"ChapterTranslationVersion", 'Boolean'>
    readonly createdBy: FieldRef<"ChapterTranslationVersion", 'String'>
    readonly createdAt: FieldRef<"ChapterTranslationVersion", 'DateTime'>
    readonly updatedAt: FieldRef<"ChapterTranslationVersion", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * ChapterTranslationVersion findUnique
   */
  export type ChapterTranslationVersionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChapterTranslationVersion
     */
    select?: ChapterTranslationVersionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ChapterTranslationVersion
     */
    omit?: ChapterTranslationVersionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChapterTranslationVersionInclude<ExtArgs> | null
    /**
     * Filter, which ChapterTranslationVersion to fetch.
     */
    where: ChapterTranslationVersionWhereUniqueInput
  }

  /**
   * ChapterTranslationVersion findUniqueOrThrow
   */
  export type ChapterTranslationVersionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChapterTranslationVersion
     */
    select?: ChapterTranslationVersionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ChapterTranslationVersion
     */
    omit?: ChapterTranslationVersionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChapterTranslationVersionInclude<ExtArgs> | null
    /**
     * Filter, which ChapterTranslationVersion to fetch.
     */
    where: ChapterTranslationVersionWhereUniqueInput
  }

  /**
   * ChapterTranslationVersion findFirst
   */
  export type ChapterTranslationVersionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChapterTranslationVersion
     */
    select?: ChapterTranslationVersionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ChapterTranslationVersion
     */
    omit?: ChapterTranslationVersionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChapterTranslationVersionInclude<ExtArgs> | null
    /**
     * Filter, which ChapterTranslationVersion to fetch.
     */
    where?: ChapterTranslationVersionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ChapterTranslationVersions to fetch.
     */
    orderBy?: ChapterTranslationVersionOrderByWithRelationInput | ChapterTranslationVersionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ChapterTranslationVersions.
     */
    cursor?: ChapterTranslationVersionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ChapterTranslationVersions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ChapterTranslationVersions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ChapterTranslationVersions.
     */
    distinct?: ChapterTranslationVersionScalarFieldEnum | ChapterTranslationVersionScalarFieldEnum[]
  }

  /**
   * ChapterTranslationVersion findFirstOrThrow
   */
  export type ChapterTranslationVersionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChapterTranslationVersion
     */
    select?: ChapterTranslationVersionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ChapterTranslationVersion
     */
    omit?: ChapterTranslationVersionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChapterTranslationVersionInclude<ExtArgs> | null
    /**
     * Filter, which ChapterTranslationVersion to fetch.
     */
    where?: ChapterTranslationVersionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ChapterTranslationVersions to fetch.
     */
    orderBy?: ChapterTranslationVersionOrderByWithRelationInput | ChapterTranslationVersionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ChapterTranslationVersions.
     */
    cursor?: ChapterTranslationVersionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ChapterTranslationVersions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ChapterTranslationVersions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ChapterTranslationVersions.
     */
    distinct?: ChapterTranslationVersionScalarFieldEnum | ChapterTranslationVersionScalarFieldEnum[]
  }

  /**
   * ChapterTranslationVersion findMany
   */
  export type ChapterTranslationVersionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChapterTranslationVersion
     */
    select?: ChapterTranslationVersionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ChapterTranslationVersion
     */
    omit?: ChapterTranslationVersionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChapterTranslationVersionInclude<ExtArgs> | null
    /**
     * Filter, which ChapterTranslationVersions to fetch.
     */
    where?: ChapterTranslationVersionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ChapterTranslationVersions to fetch.
     */
    orderBy?: ChapterTranslationVersionOrderByWithRelationInput | ChapterTranslationVersionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ChapterTranslationVersions.
     */
    cursor?: ChapterTranslationVersionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ChapterTranslationVersions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ChapterTranslationVersions.
     */
    skip?: number
    distinct?: ChapterTranslationVersionScalarFieldEnum | ChapterTranslationVersionScalarFieldEnum[]
  }

  /**
   * ChapterTranslationVersion create
   */
  export type ChapterTranslationVersionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChapterTranslationVersion
     */
    select?: ChapterTranslationVersionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ChapterTranslationVersion
     */
    omit?: ChapterTranslationVersionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChapterTranslationVersionInclude<ExtArgs> | null
    /**
     * The data needed to create a ChapterTranslationVersion.
     */
    data: XOR<ChapterTranslationVersionCreateInput, ChapterTranslationVersionUncheckedCreateInput>
  }

  /**
   * ChapterTranslationVersion createMany
   */
  export type ChapterTranslationVersionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ChapterTranslationVersions.
     */
    data: ChapterTranslationVersionCreateManyInput | ChapterTranslationVersionCreateManyInput[]
  }

  /**
   * ChapterTranslationVersion createManyAndReturn
   */
  export type ChapterTranslationVersionCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChapterTranslationVersion
     */
    select?: ChapterTranslationVersionSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ChapterTranslationVersion
     */
    omit?: ChapterTranslationVersionOmit<ExtArgs> | null
    /**
     * The data used to create many ChapterTranslationVersions.
     */
    data: ChapterTranslationVersionCreateManyInput | ChapterTranslationVersionCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChapterTranslationVersionIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * ChapterTranslationVersion update
   */
  export type ChapterTranslationVersionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChapterTranslationVersion
     */
    select?: ChapterTranslationVersionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ChapterTranslationVersion
     */
    omit?: ChapterTranslationVersionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChapterTranslationVersionInclude<ExtArgs> | null
    /**
     * The data needed to update a ChapterTranslationVersion.
     */
    data: XOR<ChapterTranslationVersionUpdateInput, ChapterTranslationVersionUncheckedUpdateInput>
    /**
     * Choose, which ChapterTranslationVersion to update.
     */
    where: ChapterTranslationVersionWhereUniqueInput
  }

  /**
   * ChapterTranslationVersion updateMany
   */
  export type ChapterTranslationVersionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ChapterTranslationVersions.
     */
    data: XOR<ChapterTranslationVersionUpdateManyMutationInput, ChapterTranslationVersionUncheckedUpdateManyInput>
    /**
     * Filter which ChapterTranslationVersions to update
     */
    where?: ChapterTranslationVersionWhereInput
    /**
     * Limit how many ChapterTranslationVersions to update.
     */
    limit?: number
  }

  /**
   * ChapterTranslationVersion updateManyAndReturn
   */
  export type ChapterTranslationVersionUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChapterTranslationVersion
     */
    select?: ChapterTranslationVersionSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ChapterTranslationVersion
     */
    omit?: ChapterTranslationVersionOmit<ExtArgs> | null
    /**
     * The data used to update ChapterTranslationVersions.
     */
    data: XOR<ChapterTranslationVersionUpdateManyMutationInput, ChapterTranslationVersionUncheckedUpdateManyInput>
    /**
     * Filter which ChapterTranslationVersions to update
     */
    where?: ChapterTranslationVersionWhereInput
    /**
     * Limit how many ChapterTranslationVersions to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChapterTranslationVersionIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * ChapterTranslationVersion upsert
   */
  export type ChapterTranslationVersionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChapterTranslationVersion
     */
    select?: ChapterTranslationVersionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ChapterTranslationVersion
     */
    omit?: ChapterTranslationVersionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChapterTranslationVersionInclude<ExtArgs> | null
    /**
     * The filter to search for the ChapterTranslationVersion to update in case it exists.
     */
    where: ChapterTranslationVersionWhereUniqueInput
    /**
     * In case the ChapterTranslationVersion found by the `where` argument doesn't exist, create a new ChapterTranslationVersion with this data.
     */
    create: XOR<ChapterTranslationVersionCreateInput, ChapterTranslationVersionUncheckedCreateInput>
    /**
     * In case the ChapterTranslationVersion was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ChapterTranslationVersionUpdateInput, ChapterTranslationVersionUncheckedUpdateInput>
  }

  /**
   * ChapterTranslationVersion delete
   */
  export type ChapterTranslationVersionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChapterTranslationVersion
     */
    select?: ChapterTranslationVersionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ChapterTranslationVersion
     */
    omit?: ChapterTranslationVersionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChapterTranslationVersionInclude<ExtArgs> | null
    /**
     * Filter which ChapterTranslationVersion to delete.
     */
    where: ChapterTranslationVersionWhereUniqueInput
  }

  /**
   * ChapterTranslationVersion deleteMany
   */
  export type ChapterTranslationVersionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ChapterTranslationVersions to delete
     */
    where?: ChapterTranslationVersionWhereInput
    /**
     * Limit how many ChapterTranslationVersions to delete.
     */
    limit?: number
  }

  /**
   * ChapterTranslationVersion without action
   */
  export type ChapterTranslationVersionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChapterTranslationVersion
     */
    select?: ChapterTranslationVersionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ChapterTranslationVersion
     */
    omit?: ChapterTranslationVersionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChapterTranslationVersionInclude<ExtArgs> | null
  }


  /**
   * Model TranslationRun
   */

  export type AggregateTranslationRun = {
    _count: TranslationRunCountAggregateOutputType | null
    _avg: TranslationRunAvgAggregateOutputType | null
    _sum: TranslationRunSumAggregateOutputType | null
    _min: TranslationRunMinAggregateOutputType | null
    _max: TranslationRunMaxAggregateOutputType | null
  }

  export type TranslationRunAvgAggregateOutputType = {
    queuedCount: number | null
    completedCount: number | null
    failedCount: number | null
    tokenUsage: number | null
    estimatedCost: number | null
  }

  export type TranslationRunSumAggregateOutputType = {
    queuedCount: number | null
    completedCount: number | null
    failedCount: number | null
    tokenUsage: number | null
    estimatedCost: number | null
  }

  export type TranslationRunMinAggregateOutputType = {
    id: string | null
    projectId: string | null
    triggerType: string | null
    scope: string | null
    status: string | null
    queuedCount: number | null
    completedCount: number | null
    failedCount: number | null
    tokenUsage: number | null
    estimatedCost: number | null
    errorMessage: string | null
    startedAt: Date | null
    endedAt: Date | null
    createdAt: Date | null
  }

  export type TranslationRunMaxAggregateOutputType = {
    id: string | null
    projectId: string | null
    triggerType: string | null
    scope: string | null
    status: string | null
    queuedCount: number | null
    completedCount: number | null
    failedCount: number | null
    tokenUsage: number | null
    estimatedCost: number | null
    errorMessage: string | null
    startedAt: Date | null
    endedAt: Date | null
    createdAt: Date | null
  }

  export type TranslationRunCountAggregateOutputType = {
    id: number
    projectId: number
    triggerType: number
    scope: number
    status: number
    queuedCount: number
    completedCount: number
    failedCount: number
    tokenUsage: number
    estimatedCost: number
    errorMessage: number
    startedAt: number
    endedAt: number
    createdAt: number
    _all: number
  }


  export type TranslationRunAvgAggregateInputType = {
    queuedCount?: true
    completedCount?: true
    failedCount?: true
    tokenUsage?: true
    estimatedCost?: true
  }

  export type TranslationRunSumAggregateInputType = {
    queuedCount?: true
    completedCount?: true
    failedCount?: true
    tokenUsage?: true
    estimatedCost?: true
  }

  export type TranslationRunMinAggregateInputType = {
    id?: true
    projectId?: true
    triggerType?: true
    scope?: true
    status?: true
    queuedCount?: true
    completedCount?: true
    failedCount?: true
    tokenUsage?: true
    estimatedCost?: true
    errorMessage?: true
    startedAt?: true
    endedAt?: true
    createdAt?: true
  }

  export type TranslationRunMaxAggregateInputType = {
    id?: true
    projectId?: true
    triggerType?: true
    scope?: true
    status?: true
    queuedCount?: true
    completedCount?: true
    failedCount?: true
    tokenUsage?: true
    estimatedCost?: true
    errorMessage?: true
    startedAt?: true
    endedAt?: true
    createdAt?: true
  }

  export type TranslationRunCountAggregateInputType = {
    id?: true
    projectId?: true
    triggerType?: true
    scope?: true
    status?: true
    queuedCount?: true
    completedCount?: true
    failedCount?: true
    tokenUsage?: true
    estimatedCost?: true
    errorMessage?: true
    startedAt?: true
    endedAt?: true
    createdAt?: true
    _all?: true
  }

  export type TranslationRunAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TranslationRun to aggregate.
     */
    where?: TranslationRunWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TranslationRuns to fetch.
     */
    orderBy?: TranslationRunOrderByWithRelationInput | TranslationRunOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TranslationRunWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TranslationRuns from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TranslationRuns.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned TranslationRuns
    **/
    _count?: true | TranslationRunCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: TranslationRunAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: TranslationRunSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TranslationRunMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TranslationRunMaxAggregateInputType
  }

  export type GetTranslationRunAggregateType<T extends TranslationRunAggregateArgs> = {
        [P in keyof T & keyof AggregateTranslationRun]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTranslationRun[P]>
      : GetScalarType<T[P], AggregateTranslationRun[P]>
  }




  export type TranslationRunGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TranslationRunWhereInput
    orderBy?: TranslationRunOrderByWithAggregationInput | TranslationRunOrderByWithAggregationInput[]
    by: TranslationRunScalarFieldEnum[] | TranslationRunScalarFieldEnum
    having?: TranslationRunScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TranslationRunCountAggregateInputType | true
    _avg?: TranslationRunAvgAggregateInputType
    _sum?: TranslationRunSumAggregateInputType
    _min?: TranslationRunMinAggregateInputType
    _max?: TranslationRunMaxAggregateInputType
  }

  export type TranslationRunGroupByOutputType = {
    id: string
    projectId: string
    triggerType: string
    scope: string
    status: string
    queuedCount: number
    completedCount: number
    failedCount: number
    tokenUsage: number
    estimatedCost: number
    errorMessage: string | null
    startedAt: Date | null
    endedAt: Date | null
    createdAt: Date
    _count: TranslationRunCountAggregateOutputType | null
    _avg: TranslationRunAvgAggregateOutputType | null
    _sum: TranslationRunSumAggregateOutputType | null
    _min: TranslationRunMinAggregateOutputType | null
    _max: TranslationRunMaxAggregateOutputType | null
  }

  type GetTranslationRunGroupByPayload<T extends TranslationRunGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TranslationRunGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TranslationRunGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TranslationRunGroupByOutputType[P]>
            : GetScalarType<T[P], TranslationRunGroupByOutputType[P]>
        }
      >
    >


  export type TranslationRunSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    projectId?: boolean
    triggerType?: boolean
    scope?: boolean
    status?: boolean
    queuedCount?: boolean
    completedCount?: boolean
    failedCount?: boolean
    tokenUsage?: boolean
    estimatedCost?: boolean
    errorMessage?: boolean
    startedAt?: boolean
    endedAt?: boolean
    createdAt?: boolean
    project?: boolean | TranslationProjectDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["translationRun"]>

  export type TranslationRunSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    projectId?: boolean
    triggerType?: boolean
    scope?: boolean
    status?: boolean
    queuedCount?: boolean
    completedCount?: boolean
    failedCount?: boolean
    tokenUsage?: boolean
    estimatedCost?: boolean
    errorMessage?: boolean
    startedAt?: boolean
    endedAt?: boolean
    createdAt?: boolean
    project?: boolean | TranslationProjectDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["translationRun"]>

  export type TranslationRunSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    projectId?: boolean
    triggerType?: boolean
    scope?: boolean
    status?: boolean
    queuedCount?: boolean
    completedCount?: boolean
    failedCount?: boolean
    tokenUsage?: boolean
    estimatedCost?: boolean
    errorMessage?: boolean
    startedAt?: boolean
    endedAt?: boolean
    createdAt?: boolean
    project?: boolean | TranslationProjectDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["translationRun"]>

  export type TranslationRunSelectScalar = {
    id?: boolean
    projectId?: boolean
    triggerType?: boolean
    scope?: boolean
    status?: boolean
    queuedCount?: boolean
    completedCount?: boolean
    failedCount?: boolean
    tokenUsage?: boolean
    estimatedCost?: boolean
    errorMessage?: boolean
    startedAt?: boolean
    endedAt?: boolean
    createdAt?: boolean
  }

  export type TranslationRunOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "projectId" | "triggerType" | "scope" | "status" | "queuedCount" | "completedCount" | "failedCount" | "tokenUsage" | "estimatedCost" | "errorMessage" | "startedAt" | "endedAt" | "createdAt", ExtArgs["result"]["translationRun"]>
  export type TranslationRunInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    project?: boolean | TranslationProjectDefaultArgs<ExtArgs>
  }
  export type TranslationRunIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    project?: boolean | TranslationProjectDefaultArgs<ExtArgs>
  }
  export type TranslationRunIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    project?: boolean | TranslationProjectDefaultArgs<ExtArgs>
  }

  export type $TranslationRunPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "TranslationRun"
    objects: {
      project: Prisma.$TranslationProjectPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      projectId: string
      triggerType: string
      scope: string
      status: string
      queuedCount: number
      completedCount: number
      failedCount: number
      tokenUsage: number
      estimatedCost: number
      errorMessage: string | null
      startedAt: Date | null
      endedAt: Date | null
      createdAt: Date
    }, ExtArgs["result"]["translationRun"]>
    composites: {}
  }

  type TranslationRunGetPayload<S extends boolean | null | undefined | TranslationRunDefaultArgs> = $Result.GetResult<Prisma.$TranslationRunPayload, S>

  type TranslationRunCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<TranslationRunFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: TranslationRunCountAggregateInputType | true
    }

  export interface TranslationRunDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['TranslationRun'], meta: { name: 'TranslationRun' } }
    /**
     * Find zero or one TranslationRun that matches the filter.
     * @param {TranslationRunFindUniqueArgs} args - Arguments to find a TranslationRun
     * @example
     * // Get one TranslationRun
     * const translationRun = await prisma.translationRun.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TranslationRunFindUniqueArgs>(args: SelectSubset<T, TranslationRunFindUniqueArgs<ExtArgs>>): Prisma__TranslationRunClient<$Result.GetResult<Prisma.$TranslationRunPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one TranslationRun that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {TranslationRunFindUniqueOrThrowArgs} args - Arguments to find a TranslationRun
     * @example
     * // Get one TranslationRun
     * const translationRun = await prisma.translationRun.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TranslationRunFindUniqueOrThrowArgs>(args: SelectSubset<T, TranslationRunFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TranslationRunClient<$Result.GetResult<Prisma.$TranslationRunPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first TranslationRun that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TranslationRunFindFirstArgs} args - Arguments to find a TranslationRun
     * @example
     * // Get one TranslationRun
     * const translationRun = await prisma.translationRun.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TranslationRunFindFirstArgs>(args?: SelectSubset<T, TranslationRunFindFirstArgs<ExtArgs>>): Prisma__TranslationRunClient<$Result.GetResult<Prisma.$TranslationRunPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first TranslationRun that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TranslationRunFindFirstOrThrowArgs} args - Arguments to find a TranslationRun
     * @example
     * // Get one TranslationRun
     * const translationRun = await prisma.translationRun.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TranslationRunFindFirstOrThrowArgs>(args?: SelectSubset<T, TranslationRunFindFirstOrThrowArgs<ExtArgs>>): Prisma__TranslationRunClient<$Result.GetResult<Prisma.$TranslationRunPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more TranslationRuns that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TranslationRunFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all TranslationRuns
     * const translationRuns = await prisma.translationRun.findMany()
     * 
     * // Get first 10 TranslationRuns
     * const translationRuns = await prisma.translationRun.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const translationRunWithIdOnly = await prisma.translationRun.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends TranslationRunFindManyArgs>(args?: SelectSubset<T, TranslationRunFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TranslationRunPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a TranslationRun.
     * @param {TranslationRunCreateArgs} args - Arguments to create a TranslationRun.
     * @example
     * // Create one TranslationRun
     * const TranslationRun = await prisma.translationRun.create({
     *   data: {
     *     // ... data to create a TranslationRun
     *   }
     * })
     * 
     */
    create<T extends TranslationRunCreateArgs>(args: SelectSubset<T, TranslationRunCreateArgs<ExtArgs>>): Prisma__TranslationRunClient<$Result.GetResult<Prisma.$TranslationRunPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many TranslationRuns.
     * @param {TranslationRunCreateManyArgs} args - Arguments to create many TranslationRuns.
     * @example
     * // Create many TranslationRuns
     * const translationRun = await prisma.translationRun.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TranslationRunCreateManyArgs>(args?: SelectSubset<T, TranslationRunCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many TranslationRuns and returns the data saved in the database.
     * @param {TranslationRunCreateManyAndReturnArgs} args - Arguments to create many TranslationRuns.
     * @example
     * // Create many TranslationRuns
     * const translationRun = await prisma.translationRun.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many TranslationRuns and only return the `id`
     * const translationRunWithIdOnly = await prisma.translationRun.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends TranslationRunCreateManyAndReturnArgs>(args?: SelectSubset<T, TranslationRunCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TranslationRunPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a TranslationRun.
     * @param {TranslationRunDeleteArgs} args - Arguments to delete one TranslationRun.
     * @example
     * // Delete one TranslationRun
     * const TranslationRun = await prisma.translationRun.delete({
     *   where: {
     *     // ... filter to delete one TranslationRun
     *   }
     * })
     * 
     */
    delete<T extends TranslationRunDeleteArgs>(args: SelectSubset<T, TranslationRunDeleteArgs<ExtArgs>>): Prisma__TranslationRunClient<$Result.GetResult<Prisma.$TranslationRunPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one TranslationRun.
     * @param {TranslationRunUpdateArgs} args - Arguments to update one TranslationRun.
     * @example
     * // Update one TranslationRun
     * const translationRun = await prisma.translationRun.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TranslationRunUpdateArgs>(args: SelectSubset<T, TranslationRunUpdateArgs<ExtArgs>>): Prisma__TranslationRunClient<$Result.GetResult<Prisma.$TranslationRunPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more TranslationRuns.
     * @param {TranslationRunDeleteManyArgs} args - Arguments to filter TranslationRuns to delete.
     * @example
     * // Delete a few TranslationRuns
     * const { count } = await prisma.translationRun.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TranslationRunDeleteManyArgs>(args?: SelectSubset<T, TranslationRunDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more TranslationRuns.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TranslationRunUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many TranslationRuns
     * const translationRun = await prisma.translationRun.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TranslationRunUpdateManyArgs>(args: SelectSubset<T, TranslationRunUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more TranslationRuns and returns the data updated in the database.
     * @param {TranslationRunUpdateManyAndReturnArgs} args - Arguments to update many TranslationRuns.
     * @example
     * // Update many TranslationRuns
     * const translationRun = await prisma.translationRun.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more TranslationRuns and only return the `id`
     * const translationRunWithIdOnly = await prisma.translationRun.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends TranslationRunUpdateManyAndReturnArgs>(args: SelectSubset<T, TranslationRunUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TranslationRunPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one TranslationRun.
     * @param {TranslationRunUpsertArgs} args - Arguments to update or create a TranslationRun.
     * @example
     * // Update or create a TranslationRun
     * const translationRun = await prisma.translationRun.upsert({
     *   create: {
     *     // ... data to create a TranslationRun
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the TranslationRun we want to update
     *   }
     * })
     */
    upsert<T extends TranslationRunUpsertArgs>(args: SelectSubset<T, TranslationRunUpsertArgs<ExtArgs>>): Prisma__TranslationRunClient<$Result.GetResult<Prisma.$TranslationRunPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of TranslationRuns.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TranslationRunCountArgs} args - Arguments to filter TranslationRuns to count.
     * @example
     * // Count the number of TranslationRuns
     * const count = await prisma.translationRun.count({
     *   where: {
     *     // ... the filter for the TranslationRuns we want to count
     *   }
     * })
    **/
    count<T extends TranslationRunCountArgs>(
      args?: Subset<T, TranslationRunCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TranslationRunCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a TranslationRun.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TranslationRunAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TranslationRunAggregateArgs>(args: Subset<T, TranslationRunAggregateArgs>): Prisma.PrismaPromise<GetTranslationRunAggregateType<T>>

    /**
     * Group by TranslationRun.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TranslationRunGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends TranslationRunGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TranslationRunGroupByArgs['orderBy'] }
        : { orderBy?: TranslationRunGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, TranslationRunGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTranslationRunGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the TranslationRun model
   */
  readonly fields: TranslationRunFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for TranslationRun.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TranslationRunClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    project<T extends TranslationProjectDefaultArgs<ExtArgs> = {}>(args?: Subset<T, TranslationProjectDefaultArgs<ExtArgs>>): Prisma__TranslationProjectClient<$Result.GetResult<Prisma.$TranslationProjectPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the TranslationRun model
   */
  interface TranslationRunFieldRefs {
    readonly id: FieldRef<"TranslationRun", 'String'>
    readonly projectId: FieldRef<"TranslationRun", 'String'>
    readonly triggerType: FieldRef<"TranslationRun", 'String'>
    readonly scope: FieldRef<"TranslationRun", 'String'>
    readonly status: FieldRef<"TranslationRun", 'String'>
    readonly queuedCount: FieldRef<"TranslationRun", 'Int'>
    readonly completedCount: FieldRef<"TranslationRun", 'Int'>
    readonly failedCount: FieldRef<"TranslationRun", 'Int'>
    readonly tokenUsage: FieldRef<"TranslationRun", 'Int'>
    readonly estimatedCost: FieldRef<"TranslationRun", 'Float'>
    readonly errorMessage: FieldRef<"TranslationRun", 'String'>
    readonly startedAt: FieldRef<"TranslationRun", 'DateTime'>
    readonly endedAt: FieldRef<"TranslationRun", 'DateTime'>
    readonly createdAt: FieldRef<"TranslationRun", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * TranslationRun findUnique
   */
  export type TranslationRunFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TranslationRun
     */
    select?: TranslationRunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TranslationRun
     */
    omit?: TranslationRunOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TranslationRunInclude<ExtArgs> | null
    /**
     * Filter, which TranslationRun to fetch.
     */
    where: TranslationRunWhereUniqueInput
  }

  /**
   * TranslationRun findUniqueOrThrow
   */
  export type TranslationRunFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TranslationRun
     */
    select?: TranslationRunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TranslationRun
     */
    omit?: TranslationRunOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TranslationRunInclude<ExtArgs> | null
    /**
     * Filter, which TranslationRun to fetch.
     */
    where: TranslationRunWhereUniqueInput
  }

  /**
   * TranslationRun findFirst
   */
  export type TranslationRunFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TranslationRun
     */
    select?: TranslationRunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TranslationRun
     */
    omit?: TranslationRunOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TranslationRunInclude<ExtArgs> | null
    /**
     * Filter, which TranslationRun to fetch.
     */
    where?: TranslationRunWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TranslationRuns to fetch.
     */
    orderBy?: TranslationRunOrderByWithRelationInput | TranslationRunOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TranslationRuns.
     */
    cursor?: TranslationRunWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TranslationRuns from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TranslationRuns.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TranslationRuns.
     */
    distinct?: TranslationRunScalarFieldEnum | TranslationRunScalarFieldEnum[]
  }

  /**
   * TranslationRun findFirstOrThrow
   */
  export type TranslationRunFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TranslationRun
     */
    select?: TranslationRunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TranslationRun
     */
    omit?: TranslationRunOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TranslationRunInclude<ExtArgs> | null
    /**
     * Filter, which TranslationRun to fetch.
     */
    where?: TranslationRunWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TranslationRuns to fetch.
     */
    orderBy?: TranslationRunOrderByWithRelationInput | TranslationRunOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TranslationRuns.
     */
    cursor?: TranslationRunWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TranslationRuns from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TranslationRuns.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TranslationRuns.
     */
    distinct?: TranslationRunScalarFieldEnum | TranslationRunScalarFieldEnum[]
  }

  /**
   * TranslationRun findMany
   */
  export type TranslationRunFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TranslationRun
     */
    select?: TranslationRunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TranslationRun
     */
    omit?: TranslationRunOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TranslationRunInclude<ExtArgs> | null
    /**
     * Filter, which TranslationRuns to fetch.
     */
    where?: TranslationRunWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TranslationRuns to fetch.
     */
    orderBy?: TranslationRunOrderByWithRelationInput | TranslationRunOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing TranslationRuns.
     */
    cursor?: TranslationRunWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TranslationRuns from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TranslationRuns.
     */
    skip?: number
    distinct?: TranslationRunScalarFieldEnum | TranslationRunScalarFieldEnum[]
  }

  /**
   * TranslationRun create
   */
  export type TranslationRunCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TranslationRun
     */
    select?: TranslationRunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TranslationRun
     */
    omit?: TranslationRunOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TranslationRunInclude<ExtArgs> | null
    /**
     * The data needed to create a TranslationRun.
     */
    data: XOR<TranslationRunCreateInput, TranslationRunUncheckedCreateInput>
  }

  /**
   * TranslationRun createMany
   */
  export type TranslationRunCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many TranslationRuns.
     */
    data: TranslationRunCreateManyInput | TranslationRunCreateManyInput[]
  }

  /**
   * TranslationRun createManyAndReturn
   */
  export type TranslationRunCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TranslationRun
     */
    select?: TranslationRunSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the TranslationRun
     */
    omit?: TranslationRunOmit<ExtArgs> | null
    /**
     * The data used to create many TranslationRuns.
     */
    data: TranslationRunCreateManyInput | TranslationRunCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TranslationRunIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * TranslationRun update
   */
  export type TranslationRunUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TranslationRun
     */
    select?: TranslationRunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TranslationRun
     */
    omit?: TranslationRunOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TranslationRunInclude<ExtArgs> | null
    /**
     * The data needed to update a TranslationRun.
     */
    data: XOR<TranslationRunUpdateInput, TranslationRunUncheckedUpdateInput>
    /**
     * Choose, which TranslationRun to update.
     */
    where: TranslationRunWhereUniqueInput
  }

  /**
   * TranslationRun updateMany
   */
  export type TranslationRunUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update TranslationRuns.
     */
    data: XOR<TranslationRunUpdateManyMutationInput, TranslationRunUncheckedUpdateManyInput>
    /**
     * Filter which TranslationRuns to update
     */
    where?: TranslationRunWhereInput
    /**
     * Limit how many TranslationRuns to update.
     */
    limit?: number
  }

  /**
   * TranslationRun updateManyAndReturn
   */
  export type TranslationRunUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TranslationRun
     */
    select?: TranslationRunSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the TranslationRun
     */
    omit?: TranslationRunOmit<ExtArgs> | null
    /**
     * The data used to update TranslationRuns.
     */
    data: XOR<TranslationRunUpdateManyMutationInput, TranslationRunUncheckedUpdateManyInput>
    /**
     * Filter which TranslationRuns to update
     */
    where?: TranslationRunWhereInput
    /**
     * Limit how many TranslationRuns to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TranslationRunIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * TranslationRun upsert
   */
  export type TranslationRunUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TranslationRun
     */
    select?: TranslationRunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TranslationRun
     */
    omit?: TranslationRunOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TranslationRunInclude<ExtArgs> | null
    /**
     * The filter to search for the TranslationRun to update in case it exists.
     */
    where: TranslationRunWhereUniqueInput
    /**
     * In case the TranslationRun found by the `where` argument doesn't exist, create a new TranslationRun with this data.
     */
    create: XOR<TranslationRunCreateInput, TranslationRunUncheckedCreateInput>
    /**
     * In case the TranslationRun was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TranslationRunUpdateInput, TranslationRunUncheckedUpdateInput>
  }

  /**
   * TranslationRun delete
   */
  export type TranslationRunDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TranslationRun
     */
    select?: TranslationRunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TranslationRun
     */
    omit?: TranslationRunOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TranslationRunInclude<ExtArgs> | null
    /**
     * Filter which TranslationRun to delete.
     */
    where: TranslationRunWhereUniqueInput
  }

  /**
   * TranslationRun deleteMany
   */
  export type TranslationRunDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TranslationRuns to delete
     */
    where?: TranslationRunWhereInput
    /**
     * Limit how many TranslationRuns to delete.
     */
    limit?: number
  }

  /**
   * TranslationRun without action
   */
  export type TranslationRunDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TranslationRun
     */
    select?: TranslationRunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TranslationRun
     */
    omit?: TranslationRunOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TranslationRunInclude<ExtArgs> | null
  }


  /**
   * Model PluginSource
   */

  export type AggregatePluginSource = {
    _count: PluginSourceCountAggregateOutputType | null
    _avg: PluginSourceAvgAggregateOutputType | null
    _sum: PluginSourceSumAggregateOutputType | null
    _min: PluginSourceMinAggregateOutputType | null
    _max: PluginSourceMaxAggregateOutputType | null
  }

  export type PluginSourceAvgAggregateOutputType = {
    timeoutMs: number | null
  }

  export type PluginSourceSumAggregateOutputType = {
    timeoutMs: number | null
  }

  export type PluginSourceMinAggregateOutputType = {
    id: string | null
    name: string | null
    enabled: boolean | null
    version: string | null
    trustType: string | null
    supportsHome: boolean | null
    supportsSearch: boolean | null
    supportsGenre: boolean | null
    supportsPagination: boolean | null
    supportsDetailDescription: boolean | null
    supportsBrowserAutomation: boolean | null
    timeoutMs: number | null
    lastCheckedAt: Date | null
    lastError: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type PluginSourceMaxAggregateOutputType = {
    id: string | null
    name: string | null
    enabled: boolean | null
    version: string | null
    trustType: string | null
    supportsHome: boolean | null
    supportsSearch: boolean | null
    supportsGenre: boolean | null
    supportsPagination: boolean | null
    supportsDetailDescription: boolean | null
    supportsBrowserAutomation: boolean | null
    timeoutMs: number | null
    lastCheckedAt: Date | null
    lastError: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type PluginSourceCountAggregateOutputType = {
    id: number
    name: number
    enabled: number
    version: number
    trustType: number
    supportsHome: number
    supportsSearch: number
    supportsGenre: number
    supportsPagination: number
    supportsDetailDescription: number
    supportsBrowserAutomation: number
    timeoutMs: number
    lastCheckedAt: number
    lastError: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type PluginSourceAvgAggregateInputType = {
    timeoutMs?: true
  }

  export type PluginSourceSumAggregateInputType = {
    timeoutMs?: true
  }

  export type PluginSourceMinAggregateInputType = {
    id?: true
    name?: true
    enabled?: true
    version?: true
    trustType?: true
    supportsHome?: true
    supportsSearch?: true
    supportsGenre?: true
    supportsPagination?: true
    supportsDetailDescription?: true
    supportsBrowserAutomation?: true
    timeoutMs?: true
    lastCheckedAt?: true
    lastError?: true
    createdAt?: true
    updatedAt?: true
  }

  export type PluginSourceMaxAggregateInputType = {
    id?: true
    name?: true
    enabled?: true
    version?: true
    trustType?: true
    supportsHome?: true
    supportsSearch?: true
    supportsGenre?: true
    supportsPagination?: true
    supportsDetailDescription?: true
    supportsBrowserAutomation?: true
    timeoutMs?: true
    lastCheckedAt?: true
    lastError?: true
    createdAt?: true
    updatedAt?: true
  }

  export type PluginSourceCountAggregateInputType = {
    id?: true
    name?: true
    enabled?: true
    version?: true
    trustType?: true
    supportsHome?: true
    supportsSearch?: true
    supportsGenre?: true
    supportsPagination?: true
    supportsDetailDescription?: true
    supportsBrowserAutomation?: true
    timeoutMs?: true
    lastCheckedAt?: true
    lastError?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type PluginSourceAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PluginSource to aggregate.
     */
    where?: PluginSourceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PluginSources to fetch.
     */
    orderBy?: PluginSourceOrderByWithRelationInput | PluginSourceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PluginSourceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PluginSources from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PluginSources.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned PluginSources
    **/
    _count?: true | PluginSourceCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: PluginSourceAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: PluginSourceSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PluginSourceMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PluginSourceMaxAggregateInputType
  }

  export type GetPluginSourceAggregateType<T extends PluginSourceAggregateArgs> = {
        [P in keyof T & keyof AggregatePluginSource]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePluginSource[P]>
      : GetScalarType<T[P], AggregatePluginSource[P]>
  }




  export type PluginSourceGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PluginSourceWhereInput
    orderBy?: PluginSourceOrderByWithAggregationInput | PluginSourceOrderByWithAggregationInput[]
    by: PluginSourceScalarFieldEnum[] | PluginSourceScalarFieldEnum
    having?: PluginSourceScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PluginSourceCountAggregateInputType | true
    _avg?: PluginSourceAvgAggregateInputType
    _sum?: PluginSourceSumAggregateInputType
    _min?: PluginSourceMinAggregateInputType
    _max?: PluginSourceMaxAggregateInputType
  }

  export type PluginSourceGroupByOutputType = {
    id: string
    name: string
    enabled: boolean
    version: string | null
    trustType: string
    supportsHome: boolean
    supportsSearch: boolean
    supportsGenre: boolean
    supportsPagination: boolean
    supportsDetailDescription: boolean
    supportsBrowserAutomation: boolean
    timeoutMs: number
    lastCheckedAt: Date | null
    lastError: string | null
    createdAt: Date
    updatedAt: Date
    _count: PluginSourceCountAggregateOutputType | null
    _avg: PluginSourceAvgAggregateOutputType | null
    _sum: PluginSourceSumAggregateOutputType | null
    _min: PluginSourceMinAggregateOutputType | null
    _max: PluginSourceMaxAggregateOutputType | null
  }

  type GetPluginSourceGroupByPayload<T extends PluginSourceGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PluginSourceGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PluginSourceGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PluginSourceGroupByOutputType[P]>
            : GetScalarType<T[P], PluginSourceGroupByOutputType[P]>
        }
      >
    >


  export type PluginSourceSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    enabled?: boolean
    version?: boolean
    trustType?: boolean
    supportsHome?: boolean
    supportsSearch?: boolean
    supportsGenre?: boolean
    supportsPagination?: boolean
    supportsDetailDescription?: boolean
    supportsBrowserAutomation?: boolean
    timeoutMs?: boolean
    lastCheckedAt?: boolean
    lastError?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["pluginSource"]>

  export type PluginSourceSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    enabled?: boolean
    version?: boolean
    trustType?: boolean
    supportsHome?: boolean
    supportsSearch?: boolean
    supportsGenre?: boolean
    supportsPagination?: boolean
    supportsDetailDescription?: boolean
    supportsBrowserAutomation?: boolean
    timeoutMs?: boolean
    lastCheckedAt?: boolean
    lastError?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["pluginSource"]>

  export type PluginSourceSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    enabled?: boolean
    version?: boolean
    trustType?: boolean
    supportsHome?: boolean
    supportsSearch?: boolean
    supportsGenre?: boolean
    supportsPagination?: boolean
    supportsDetailDescription?: boolean
    supportsBrowserAutomation?: boolean
    timeoutMs?: boolean
    lastCheckedAt?: boolean
    lastError?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["pluginSource"]>

  export type PluginSourceSelectScalar = {
    id?: boolean
    name?: boolean
    enabled?: boolean
    version?: boolean
    trustType?: boolean
    supportsHome?: boolean
    supportsSearch?: boolean
    supportsGenre?: boolean
    supportsPagination?: boolean
    supportsDetailDescription?: boolean
    supportsBrowserAutomation?: boolean
    timeoutMs?: boolean
    lastCheckedAt?: boolean
    lastError?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type PluginSourceOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "enabled" | "version" | "trustType" | "supportsHome" | "supportsSearch" | "supportsGenre" | "supportsPagination" | "supportsDetailDescription" | "supportsBrowserAutomation" | "timeoutMs" | "lastCheckedAt" | "lastError" | "createdAt" | "updatedAt", ExtArgs["result"]["pluginSource"]>

  export type $PluginSourcePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "PluginSource"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      enabled: boolean
      version: string | null
      trustType: string
      supportsHome: boolean
      supportsSearch: boolean
      supportsGenre: boolean
      supportsPagination: boolean
      supportsDetailDescription: boolean
      supportsBrowserAutomation: boolean
      timeoutMs: number
      lastCheckedAt: Date | null
      lastError: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["pluginSource"]>
    composites: {}
  }

  type PluginSourceGetPayload<S extends boolean | null | undefined | PluginSourceDefaultArgs> = $Result.GetResult<Prisma.$PluginSourcePayload, S>

  type PluginSourceCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<PluginSourceFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: PluginSourceCountAggregateInputType | true
    }

  export interface PluginSourceDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['PluginSource'], meta: { name: 'PluginSource' } }
    /**
     * Find zero or one PluginSource that matches the filter.
     * @param {PluginSourceFindUniqueArgs} args - Arguments to find a PluginSource
     * @example
     * // Get one PluginSource
     * const pluginSource = await prisma.pluginSource.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PluginSourceFindUniqueArgs>(args: SelectSubset<T, PluginSourceFindUniqueArgs<ExtArgs>>): Prisma__PluginSourceClient<$Result.GetResult<Prisma.$PluginSourcePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one PluginSource that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {PluginSourceFindUniqueOrThrowArgs} args - Arguments to find a PluginSource
     * @example
     * // Get one PluginSource
     * const pluginSource = await prisma.pluginSource.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PluginSourceFindUniqueOrThrowArgs>(args: SelectSubset<T, PluginSourceFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PluginSourceClient<$Result.GetResult<Prisma.$PluginSourcePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first PluginSource that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PluginSourceFindFirstArgs} args - Arguments to find a PluginSource
     * @example
     * // Get one PluginSource
     * const pluginSource = await prisma.pluginSource.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PluginSourceFindFirstArgs>(args?: SelectSubset<T, PluginSourceFindFirstArgs<ExtArgs>>): Prisma__PluginSourceClient<$Result.GetResult<Prisma.$PluginSourcePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first PluginSource that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PluginSourceFindFirstOrThrowArgs} args - Arguments to find a PluginSource
     * @example
     * // Get one PluginSource
     * const pluginSource = await prisma.pluginSource.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PluginSourceFindFirstOrThrowArgs>(args?: SelectSubset<T, PluginSourceFindFirstOrThrowArgs<ExtArgs>>): Prisma__PluginSourceClient<$Result.GetResult<Prisma.$PluginSourcePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more PluginSources that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PluginSourceFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all PluginSources
     * const pluginSources = await prisma.pluginSource.findMany()
     * 
     * // Get first 10 PluginSources
     * const pluginSources = await prisma.pluginSource.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const pluginSourceWithIdOnly = await prisma.pluginSource.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends PluginSourceFindManyArgs>(args?: SelectSubset<T, PluginSourceFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PluginSourcePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a PluginSource.
     * @param {PluginSourceCreateArgs} args - Arguments to create a PluginSource.
     * @example
     * // Create one PluginSource
     * const PluginSource = await prisma.pluginSource.create({
     *   data: {
     *     // ... data to create a PluginSource
     *   }
     * })
     * 
     */
    create<T extends PluginSourceCreateArgs>(args: SelectSubset<T, PluginSourceCreateArgs<ExtArgs>>): Prisma__PluginSourceClient<$Result.GetResult<Prisma.$PluginSourcePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many PluginSources.
     * @param {PluginSourceCreateManyArgs} args - Arguments to create many PluginSources.
     * @example
     * // Create many PluginSources
     * const pluginSource = await prisma.pluginSource.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends PluginSourceCreateManyArgs>(args?: SelectSubset<T, PluginSourceCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many PluginSources and returns the data saved in the database.
     * @param {PluginSourceCreateManyAndReturnArgs} args - Arguments to create many PluginSources.
     * @example
     * // Create many PluginSources
     * const pluginSource = await prisma.pluginSource.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many PluginSources and only return the `id`
     * const pluginSourceWithIdOnly = await prisma.pluginSource.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends PluginSourceCreateManyAndReturnArgs>(args?: SelectSubset<T, PluginSourceCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PluginSourcePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a PluginSource.
     * @param {PluginSourceDeleteArgs} args - Arguments to delete one PluginSource.
     * @example
     * // Delete one PluginSource
     * const PluginSource = await prisma.pluginSource.delete({
     *   where: {
     *     // ... filter to delete one PluginSource
     *   }
     * })
     * 
     */
    delete<T extends PluginSourceDeleteArgs>(args: SelectSubset<T, PluginSourceDeleteArgs<ExtArgs>>): Prisma__PluginSourceClient<$Result.GetResult<Prisma.$PluginSourcePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one PluginSource.
     * @param {PluginSourceUpdateArgs} args - Arguments to update one PluginSource.
     * @example
     * // Update one PluginSource
     * const pluginSource = await prisma.pluginSource.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends PluginSourceUpdateArgs>(args: SelectSubset<T, PluginSourceUpdateArgs<ExtArgs>>): Prisma__PluginSourceClient<$Result.GetResult<Prisma.$PluginSourcePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more PluginSources.
     * @param {PluginSourceDeleteManyArgs} args - Arguments to filter PluginSources to delete.
     * @example
     * // Delete a few PluginSources
     * const { count } = await prisma.pluginSource.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends PluginSourceDeleteManyArgs>(args?: SelectSubset<T, PluginSourceDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PluginSources.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PluginSourceUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many PluginSources
     * const pluginSource = await prisma.pluginSource.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends PluginSourceUpdateManyArgs>(args: SelectSubset<T, PluginSourceUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PluginSources and returns the data updated in the database.
     * @param {PluginSourceUpdateManyAndReturnArgs} args - Arguments to update many PluginSources.
     * @example
     * // Update many PluginSources
     * const pluginSource = await prisma.pluginSource.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more PluginSources and only return the `id`
     * const pluginSourceWithIdOnly = await prisma.pluginSource.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends PluginSourceUpdateManyAndReturnArgs>(args: SelectSubset<T, PluginSourceUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PluginSourcePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one PluginSource.
     * @param {PluginSourceUpsertArgs} args - Arguments to update or create a PluginSource.
     * @example
     * // Update or create a PluginSource
     * const pluginSource = await prisma.pluginSource.upsert({
     *   create: {
     *     // ... data to create a PluginSource
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the PluginSource we want to update
     *   }
     * })
     */
    upsert<T extends PluginSourceUpsertArgs>(args: SelectSubset<T, PluginSourceUpsertArgs<ExtArgs>>): Prisma__PluginSourceClient<$Result.GetResult<Prisma.$PluginSourcePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of PluginSources.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PluginSourceCountArgs} args - Arguments to filter PluginSources to count.
     * @example
     * // Count the number of PluginSources
     * const count = await prisma.pluginSource.count({
     *   where: {
     *     // ... the filter for the PluginSources we want to count
     *   }
     * })
    **/
    count<T extends PluginSourceCountArgs>(
      args?: Subset<T, PluginSourceCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PluginSourceCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a PluginSource.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PluginSourceAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends PluginSourceAggregateArgs>(args: Subset<T, PluginSourceAggregateArgs>): Prisma.PrismaPromise<GetPluginSourceAggregateType<T>>

    /**
     * Group by PluginSource.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PluginSourceGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends PluginSourceGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PluginSourceGroupByArgs['orderBy'] }
        : { orderBy?: PluginSourceGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, PluginSourceGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPluginSourceGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the PluginSource model
   */
  readonly fields: PluginSourceFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for PluginSource.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PluginSourceClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the PluginSource model
   */
  interface PluginSourceFieldRefs {
    readonly id: FieldRef<"PluginSource", 'String'>
    readonly name: FieldRef<"PluginSource", 'String'>
    readonly enabled: FieldRef<"PluginSource", 'Boolean'>
    readonly version: FieldRef<"PluginSource", 'String'>
    readonly trustType: FieldRef<"PluginSource", 'String'>
    readonly supportsHome: FieldRef<"PluginSource", 'Boolean'>
    readonly supportsSearch: FieldRef<"PluginSource", 'Boolean'>
    readonly supportsGenre: FieldRef<"PluginSource", 'Boolean'>
    readonly supportsPagination: FieldRef<"PluginSource", 'Boolean'>
    readonly supportsDetailDescription: FieldRef<"PluginSource", 'Boolean'>
    readonly supportsBrowserAutomation: FieldRef<"PluginSource", 'Boolean'>
    readonly timeoutMs: FieldRef<"PluginSource", 'Int'>
    readonly lastCheckedAt: FieldRef<"PluginSource", 'DateTime'>
    readonly lastError: FieldRef<"PluginSource", 'String'>
    readonly createdAt: FieldRef<"PluginSource", 'DateTime'>
    readonly updatedAt: FieldRef<"PluginSource", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * PluginSource findUnique
   */
  export type PluginSourceFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PluginSource
     */
    select?: PluginSourceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PluginSource
     */
    omit?: PluginSourceOmit<ExtArgs> | null
    /**
     * Filter, which PluginSource to fetch.
     */
    where: PluginSourceWhereUniqueInput
  }

  /**
   * PluginSource findUniqueOrThrow
   */
  export type PluginSourceFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PluginSource
     */
    select?: PluginSourceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PluginSource
     */
    omit?: PluginSourceOmit<ExtArgs> | null
    /**
     * Filter, which PluginSource to fetch.
     */
    where: PluginSourceWhereUniqueInput
  }

  /**
   * PluginSource findFirst
   */
  export type PluginSourceFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PluginSource
     */
    select?: PluginSourceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PluginSource
     */
    omit?: PluginSourceOmit<ExtArgs> | null
    /**
     * Filter, which PluginSource to fetch.
     */
    where?: PluginSourceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PluginSources to fetch.
     */
    orderBy?: PluginSourceOrderByWithRelationInput | PluginSourceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PluginSources.
     */
    cursor?: PluginSourceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PluginSources from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PluginSources.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PluginSources.
     */
    distinct?: PluginSourceScalarFieldEnum | PluginSourceScalarFieldEnum[]
  }

  /**
   * PluginSource findFirstOrThrow
   */
  export type PluginSourceFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PluginSource
     */
    select?: PluginSourceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PluginSource
     */
    omit?: PluginSourceOmit<ExtArgs> | null
    /**
     * Filter, which PluginSource to fetch.
     */
    where?: PluginSourceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PluginSources to fetch.
     */
    orderBy?: PluginSourceOrderByWithRelationInput | PluginSourceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PluginSources.
     */
    cursor?: PluginSourceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PluginSources from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PluginSources.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PluginSources.
     */
    distinct?: PluginSourceScalarFieldEnum | PluginSourceScalarFieldEnum[]
  }

  /**
   * PluginSource findMany
   */
  export type PluginSourceFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PluginSource
     */
    select?: PluginSourceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PluginSource
     */
    omit?: PluginSourceOmit<ExtArgs> | null
    /**
     * Filter, which PluginSources to fetch.
     */
    where?: PluginSourceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PluginSources to fetch.
     */
    orderBy?: PluginSourceOrderByWithRelationInput | PluginSourceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing PluginSources.
     */
    cursor?: PluginSourceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PluginSources from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PluginSources.
     */
    skip?: number
    distinct?: PluginSourceScalarFieldEnum | PluginSourceScalarFieldEnum[]
  }

  /**
   * PluginSource create
   */
  export type PluginSourceCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PluginSource
     */
    select?: PluginSourceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PluginSource
     */
    omit?: PluginSourceOmit<ExtArgs> | null
    /**
     * The data needed to create a PluginSource.
     */
    data: XOR<PluginSourceCreateInput, PluginSourceUncheckedCreateInput>
  }

  /**
   * PluginSource createMany
   */
  export type PluginSourceCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many PluginSources.
     */
    data: PluginSourceCreateManyInput | PluginSourceCreateManyInput[]
  }

  /**
   * PluginSource createManyAndReturn
   */
  export type PluginSourceCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PluginSource
     */
    select?: PluginSourceSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the PluginSource
     */
    omit?: PluginSourceOmit<ExtArgs> | null
    /**
     * The data used to create many PluginSources.
     */
    data: PluginSourceCreateManyInput | PluginSourceCreateManyInput[]
  }

  /**
   * PluginSource update
   */
  export type PluginSourceUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PluginSource
     */
    select?: PluginSourceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PluginSource
     */
    omit?: PluginSourceOmit<ExtArgs> | null
    /**
     * The data needed to update a PluginSource.
     */
    data: XOR<PluginSourceUpdateInput, PluginSourceUncheckedUpdateInput>
    /**
     * Choose, which PluginSource to update.
     */
    where: PluginSourceWhereUniqueInput
  }

  /**
   * PluginSource updateMany
   */
  export type PluginSourceUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update PluginSources.
     */
    data: XOR<PluginSourceUpdateManyMutationInput, PluginSourceUncheckedUpdateManyInput>
    /**
     * Filter which PluginSources to update
     */
    where?: PluginSourceWhereInput
    /**
     * Limit how many PluginSources to update.
     */
    limit?: number
  }

  /**
   * PluginSource updateManyAndReturn
   */
  export type PluginSourceUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PluginSource
     */
    select?: PluginSourceSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the PluginSource
     */
    omit?: PluginSourceOmit<ExtArgs> | null
    /**
     * The data used to update PluginSources.
     */
    data: XOR<PluginSourceUpdateManyMutationInput, PluginSourceUncheckedUpdateManyInput>
    /**
     * Filter which PluginSources to update
     */
    where?: PluginSourceWhereInput
    /**
     * Limit how many PluginSources to update.
     */
    limit?: number
  }

  /**
   * PluginSource upsert
   */
  export type PluginSourceUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PluginSource
     */
    select?: PluginSourceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PluginSource
     */
    omit?: PluginSourceOmit<ExtArgs> | null
    /**
     * The filter to search for the PluginSource to update in case it exists.
     */
    where: PluginSourceWhereUniqueInput
    /**
     * In case the PluginSource found by the `where` argument doesn't exist, create a new PluginSource with this data.
     */
    create: XOR<PluginSourceCreateInput, PluginSourceUncheckedCreateInput>
    /**
     * In case the PluginSource was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PluginSourceUpdateInput, PluginSourceUncheckedUpdateInput>
  }

  /**
   * PluginSource delete
   */
  export type PluginSourceDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PluginSource
     */
    select?: PluginSourceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PluginSource
     */
    omit?: PluginSourceOmit<ExtArgs> | null
    /**
     * Filter which PluginSource to delete.
     */
    where: PluginSourceWhereUniqueInput
  }

  /**
   * PluginSource deleteMany
   */
  export type PluginSourceDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PluginSources to delete
     */
    where?: PluginSourceWhereInput
    /**
     * Limit how many PluginSources to delete.
     */
    limit?: number
  }

  /**
   * PluginSource without action
   */
  export type PluginSourceDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PluginSource
     */
    select?: PluginSourceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PluginSource
     */
    omit?: PluginSourceOmit<ExtArgs> | null
  }


  /**
   * Model AppSetting
   */

  export type AggregateAppSetting = {
    _count: AppSettingCountAggregateOutputType | null
    _min: AppSettingMinAggregateOutputType | null
    _max: AppSettingMaxAggregateOutputType | null
  }

  export type AppSettingMinAggregateOutputType = {
    key: string | null
    value: string | null
    updatedAt: Date | null
  }

  export type AppSettingMaxAggregateOutputType = {
    key: string | null
    value: string | null
    updatedAt: Date | null
  }

  export type AppSettingCountAggregateOutputType = {
    key: number
    value: number
    updatedAt: number
    _all: number
  }


  export type AppSettingMinAggregateInputType = {
    key?: true
    value?: true
    updatedAt?: true
  }

  export type AppSettingMaxAggregateInputType = {
    key?: true
    value?: true
    updatedAt?: true
  }

  export type AppSettingCountAggregateInputType = {
    key?: true
    value?: true
    updatedAt?: true
    _all?: true
  }

  export type AppSettingAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which AppSetting to aggregate.
     */
    where?: AppSettingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AppSettings to fetch.
     */
    orderBy?: AppSettingOrderByWithRelationInput | AppSettingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: AppSettingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AppSettings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AppSettings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned AppSettings
    **/
    _count?: true | AppSettingCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: AppSettingMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: AppSettingMaxAggregateInputType
  }

  export type GetAppSettingAggregateType<T extends AppSettingAggregateArgs> = {
        [P in keyof T & keyof AggregateAppSetting]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateAppSetting[P]>
      : GetScalarType<T[P], AggregateAppSetting[P]>
  }




  export type AppSettingGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AppSettingWhereInput
    orderBy?: AppSettingOrderByWithAggregationInput | AppSettingOrderByWithAggregationInput[]
    by: AppSettingScalarFieldEnum[] | AppSettingScalarFieldEnum
    having?: AppSettingScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: AppSettingCountAggregateInputType | true
    _min?: AppSettingMinAggregateInputType
    _max?: AppSettingMaxAggregateInputType
  }

  export type AppSettingGroupByOutputType = {
    key: string
    value: string
    updatedAt: Date
    _count: AppSettingCountAggregateOutputType | null
    _min: AppSettingMinAggregateOutputType | null
    _max: AppSettingMaxAggregateOutputType | null
  }

  type GetAppSettingGroupByPayload<T extends AppSettingGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<AppSettingGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof AppSettingGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], AppSettingGroupByOutputType[P]>
            : GetScalarType<T[P], AppSettingGroupByOutputType[P]>
        }
      >
    >


  export type AppSettingSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    key?: boolean
    value?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["appSetting"]>

  export type AppSettingSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    key?: boolean
    value?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["appSetting"]>

  export type AppSettingSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    key?: boolean
    value?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["appSetting"]>

  export type AppSettingSelectScalar = {
    key?: boolean
    value?: boolean
    updatedAt?: boolean
  }

  export type AppSettingOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"key" | "value" | "updatedAt", ExtArgs["result"]["appSetting"]>

  export type $AppSettingPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "AppSetting"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      key: string
      value: string
      updatedAt: Date
    }, ExtArgs["result"]["appSetting"]>
    composites: {}
  }

  type AppSettingGetPayload<S extends boolean | null | undefined | AppSettingDefaultArgs> = $Result.GetResult<Prisma.$AppSettingPayload, S>

  type AppSettingCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<AppSettingFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: AppSettingCountAggregateInputType | true
    }

  export interface AppSettingDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['AppSetting'], meta: { name: 'AppSetting' } }
    /**
     * Find zero or one AppSetting that matches the filter.
     * @param {AppSettingFindUniqueArgs} args - Arguments to find a AppSetting
     * @example
     * // Get one AppSetting
     * const appSetting = await prisma.appSetting.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends AppSettingFindUniqueArgs>(args: SelectSubset<T, AppSettingFindUniqueArgs<ExtArgs>>): Prisma__AppSettingClient<$Result.GetResult<Prisma.$AppSettingPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one AppSetting that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {AppSettingFindUniqueOrThrowArgs} args - Arguments to find a AppSetting
     * @example
     * // Get one AppSetting
     * const appSetting = await prisma.appSetting.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends AppSettingFindUniqueOrThrowArgs>(args: SelectSubset<T, AppSettingFindUniqueOrThrowArgs<ExtArgs>>): Prisma__AppSettingClient<$Result.GetResult<Prisma.$AppSettingPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first AppSetting that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AppSettingFindFirstArgs} args - Arguments to find a AppSetting
     * @example
     * // Get one AppSetting
     * const appSetting = await prisma.appSetting.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends AppSettingFindFirstArgs>(args?: SelectSubset<T, AppSettingFindFirstArgs<ExtArgs>>): Prisma__AppSettingClient<$Result.GetResult<Prisma.$AppSettingPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first AppSetting that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AppSettingFindFirstOrThrowArgs} args - Arguments to find a AppSetting
     * @example
     * // Get one AppSetting
     * const appSetting = await prisma.appSetting.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends AppSettingFindFirstOrThrowArgs>(args?: SelectSubset<T, AppSettingFindFirstOrThrowArgs<ExtArgs>>): Prisma__AppSettingClient<$Result.GetResult<Prisma.$AppSettingPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more AppSettings that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AppSettingFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all AppSettings
     * const appSettings = await prisma.appSetting.findMany()
     * 
     * // Get first 10 AppSettings
     * const appSettings = await prisma.appSetting.findMany({ take: 10 })
     * 
     * // Only select the `key`
     * const appSettingWithKeyOnly = await prisma.appSetting.findMany({ select: { key: true } })
     * 
     */
    findMany<T extends AppSettingFindManyArgs>(args?: SelectSubset<T, AppSettingFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AppSettingPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a AppSetting.
     * @param {AppSettingCreateArgs} args - Arguments to create a AppSetting.
     * @example
     * // Create one AppSetting
     * const AppSetting = await prisma.appSetting.create({
     *   data: {
     *     // ... data to create a AppSetting
     *   }
     * })
     * 
     */
    create<T extends AppSettingCreateArgs>(args: SelectSubset<T, AppSettingCreateArgs<ExtArgs>>): Prisma__AppSettingClient<$Result.GetResult<Prisma.$AppSettingPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many AppSettings.
     * @param {AppSettingCreateManyArgs} args - Arguments to create many AppSettings.
     * @example
     * // Create many AppSettings
     * const appSetting = await prisma.appSetting.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends AppSettingCreateManyArgs>(args?: SelectSubset<T, AppSettingCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many AppSettings and returns the data saved in the database.
     * @param {AppSettingCreateManyAndReturnArgs} args - Arguments to create many AppSettings.
     * @example
     * // Create many AppSettings
     * const appSetting = await prisma.appSetting.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many AppSettings and only return the `key`
     * const appSettingWithKeyOnly = await prisma.appSetting.createManyAndReturn({
     *   select: { key: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends AppSettingCreateManyAndReturnArgs>(args?: SelectSubset<T, AppSettingCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AppSettingPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a AppSetting.
     * @param {AppSettingDeleteArgs} args - Arguments to delete one AppSetting.
     * @example
     * // Delete one AppSetting
     * const AppSetting = await prisma.appSetting.delete({
     *   where: {
     *     // ... filter to delete one AppSetting
     *   }
     * })
     * 
     */
    delete<T extends AppSettingDeleteArgs>(args: SelectSubset<T, AppSettingDeleteArgs<ExtArgs>>): Prisma__AppSettingClient<$Result.GetResult<Prisma.$AppSettingPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one AppSetting.
     * @param {AppSettingUpdateArgs} args - Arguments to update one AppSetting.
     * @example
     * // Update one AppSetting
     * const appSetting = await prisma.appSetting.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends AppSettingUpdateArgs>(args: SelectSubset<T, AppSettingUpdateArgs<ExtArgs>>): Prisma__AppSettingClient<$Result.GetResult<Prisma.$AppSettingPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more AppSettings.
     * @param {AppSettingDeleteManyArgs} args - Arguments to filter AppSettings to delete.
     * @example
     * // Delete a few AppSettings
     * const { count } = await prisma.appSetting.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends AppSettingDeleteManyArgs>(args?: SelectSubset<T, AppSettingDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more AppSettings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AppSettingUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many AppSettings
     * const appSetting = await prisma.appSetting.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends AppSettingUpdateManyArgs>(args: SelectSubset<T, AppSettingUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more AppSettings and returns the data updated in the database.
     * @param {AppSettingUpdateManyAndReturnArgs} args - Arguments to update many AppSettings.
     * @example
     * // Update many AppSettings
     * const appSetting = await prisma.appSetting.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more AppSettings and only return the `key`
     * const appSettingWithKeyOnly = await prisma.appSetting.updateManyAndReturn({
     *   select: { key: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends AppSettingUpdateManyAndReturnArgs>(args: SelectSubset<T, AppSettingUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AppSettingPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one AppSetting.
     * @param {AppSettingUpsertArgs} args - Arguments to update or create a AppSetting.
     * @example
     * // Update or create a AppSetting
     * const appSetting = await prisma.appSetting.upsert({
     *   create: {
     *     // ... data to create a AppSetting
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the AppSetting we want to update
     *   }
     * })
     */
    upsert<T extends AppSettingUpsertArgs>(args: SelectSubset<T, AppSettingUpsertArgs<ExtArgs>>): Prisma__AppSettingClient<$Result.GetResult<Prisma.$AppSettingPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of AppSettings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AppSettingCountArgs} args - Arguments to filter AppSettings to count.
     * @example
     * // Count the number of AppSettings
     * const count = await prisma.appSetting.count({
     *   where: {
     *     // ... the filter for the AppSettings we want to count
     *   }
     * })
    **/
    count<T extends AppSettingCountArgs>(
      args?: Subset<T, AppSettingCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], AppSettingCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a AppSetting.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AppSettingAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends AppSettingAggregateArgs>(args: Subset<T, AppSettingAggregateArgs>): Prisma.PrismaPromise<GetAppSettingAggregateType<T>>

    /**
     * Group by AppSetting.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AppSettingGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends AppSettingGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: AppSettingGroupByArgs['orderBy'] }
        : { orderBy?: AppSettingGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, AppSettingGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetAppSettingGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the AppSetting model
   */
  readonly fields: AppSettingFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for AppSetting.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__AppSettingClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the AppSetting model
   */
  interface AppSettingFieldRefs {
    readonly key: FieldRef<"AppSetting", 'String'>
    readonly value: FieldRef<"AppSetting", 'String'>
    readonly updatedAt: FieldRef<"AppSetting", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * AppSetting findUnique
   */
  export type AppSettingFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AppSetting
     */
    select?: AppSettingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AppSetting
     */
    omit?: AppSettingOmit<ExtArgs> | null
    /**
     * Filter, which AppSetting to fetch.
     */
    where: AppSettingWhereUniqueInput
  }

  /**
   * AppSetting findUniqueOrThrow
   */
  export type AppSettingFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AppSetting
     */
    select?: AppSettingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AppSetting
     */
    omit?: AppSettingOmit<ExtArgs> | null
    /**
     * Filter, which AppSetting to fetch.
     */
    where: AppSettingWhereUniqueInput
  }

  /**
   * AppSetting findFirst
   */
  export type AppSettingFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AppSetting
     */
    select?: AppSettingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AppSetting
     */
    omit?: AppSettingOmit<ExtArgs> | null
    /**
     * Filter, which AppSetting to fetch.
     */
    where?: AppSettingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AppSettings to fetch.
     */
    orderBy?: AppSettingOrderByWithRelationInput | AppSettingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for AppSettings.
     */
    cursor?: AppSettingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AppSettings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AppSettings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of AppSettings.
     */
    distinct?: AppSettingScalarFieldEnum | AppSettingScalarFieldEnum[]
  }

  /**
   * AppSetting findFirstOrThrow
   */
  export type AppSettingFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AppSetting
     */
    select?: AppSettingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AppSetting
     */
    omit?: AppSettingOmit<ExtArgs> | null
    /**
     * Filter, which AppSetting to fetch.
     */
    where?: AppSettingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AppSettings to fetch.
     */
    orderBy?: AppSettingOrderByWithRelationInput | AppSettingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for AppSettings.
     */
    cursor?: AppSettingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AppSettings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AppSettings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of AppSettings.
     */
    distinct?: AppSettingScalarFieldEnum | AppSettingScalarFieldEnum[]
  }

  /**
   * AppSetting findMany
   */
  export type AppSettingFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AppSetting
     */
    select?: AppSettingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AppSetting
     */
    omit?: AppSettingOmit<ExtArgs> | null
    /**
     * Filter, which AppSettings to fetch.
     */
    where?: AppSettingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AppSettings to fetch.
     */
    orderBy?: AppSettingOrderByWithRelationInput | AppSettingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing AppSettings.
     */
    cursor?: AppSettingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AppSettings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AppSettings.
     */
    skip?: number
    distinct?: AppSettingScalarFieldEnum | AppSettingScalarFieldEnum[]
  }

  /**
   * AppSetting create
   */
  export type AppSettingCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AppSetting
     */
    select?: AppSettingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AppSetting
     */
    omit?: AppSettingOmit<ExtArgs> | null
    /**
     * The data needed to create a AppSetting.
     */
    data: XOR<AppSettingCreateInput, AppSettingUncheckedCreateInput>
  }

  /**
   * AppSetting createMany
   */
  export type AppSettingCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many AppSettings.
     */
    data: AppSettingCreateManyInput | AppSettingCreateManyInput[]
  }

  /**
   * AppSetting createManyAndReturn
   */
  export type AppSettingCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AppSetting
     */
    select?: AppSettingSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the AppSetting
     */
    omit?: AppSettingOmit<ExtArgs> | null
    /**
     * The data used to create many AppSettings.
     */
    data: AppSettingCreateManyInput | AppSettingCreateManyInput[]
  }

  /**
   * AppSetting update
   */
  export type AppSettingUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AppSetting
     */
    select?: AppSettingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AppSetting
     */
    omit?: AppSettingOmit<ExtArgs> | null
    /**
     * The data needed to update a AppSetting.
     */
    data: XOR<AppSettingUpdateInput, AppSettingUncheckedUpdateInput>
    /**
     * Choose, which AppSetting to update.
     */
    where: AppSettingWhereUniqueInput
  }

  /**
   * AppSetting updateMany
   */
  export type AppSettingUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update AppSettings.
     */
    data: XOR<AppSettingUpdateManyMutationInput, AppSettingUncheckedUpdateManyInput>
    /**
     * Filter which AppSettings to update
     */
    where?: AppSettingWhereInput
    /**
     * Limit how many AppSettings to update.
     */
    limit?: number
  }

  /**
   * AppSetting updateManyAndReturn
   */
  export type AppSettingUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AppSetting
     */
    select?: AppSettingSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the AppSetting
     */
    omit?: AppSettingOmit<ExtArgs> | null
    /**
     * The data used to update AppSettings.
     */
    data: XOR<AppSettingUpdateManyMutationInput, AppSettingUncheckedUpdateManyInput>
    /**
     * Filter which AppSettings to update
     */
    where?: AppSettingWhereInput
    /**
     * Limit how many AppSettings to update.
     */
    limit?: number
  }

  /**
   * AppSetting upsert
   */
  export type AppSettingUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AppSetting
     */
    select?: AppSettingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AppSetting
     */
    omit?: AppSettingOmit<ExtArgs> | null
    /**
     * The filter to search for the AppSetting to update in case it exists.
     */
    where: AppSettingWhereUniqueInput
    /**
     * In case the AppSetting found by the `where` argument doesn't exist, create a new AppSetting with this data.
     */
    create: XOR<AppSettingCreateInput, AppSettingUncheckedCreateInput>
    /**
     * In case the AppSetting was found with the provided `where` argument, update it with this data.
     */
    update: XOR<AppSettingUpdateInput, AppSettingUncheckedUpdateInput>
  }

  /**
   * AppSetting delete
   */
  export type AppSettingDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AppSetting
     */
    select?: AppSettingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AppSetting
     */
    omit?: AppSettingOmit<ExtArgs> | null
    /**
     * Filter which AppSetting to delete.
     */
    where: AppSettingWhereUniqueInput
  }

  /**
   * AppSetting deleteMany
   */
  export type AppSettingDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which AppSettings to delete
     */
    where?: AppSettingWhereInput
    /**
     * Limit how many AppSettings to delete.
     */
    limit?: number
  }

  /**
   * AppSetting without action
   */
  export type AppSettingDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AppSetting
     */
    select?: AppSettingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AppSetting
     */
    omit?: AppSettingOmit<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const NovelScalarFieldEnum: {
    id: 'id',
    title: 'title',
    author: 'author',
    sourceId: 'sourceId',
    sourceName: 'sourceName',
    sourceUrl: 'sourceUrl',
    coverUrl: 'coverUrl',
    coverLocalPath: 'coverLocalPath',
    description: 'description',
    status: 'status',
    syncStatus: 'syncStatus',
    totalChapters: 'totalChapters',
    downloadedChapters: 'downloadedChapters',
    defaultEditionKind: 'defaultEditionKind',
    defaultTranslationProjectId: 'defaultTranslationProjectId',
    lastCheckedAt: 'lastCheckedAt',
    lastSyncStartedAt: 'lastSyncStartedAt',
    lastSyncEndedAt: 'lastSyncEndedAt',
    lastError: 'lastError',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type NovelScalarFieldEnum = (typeof NovelScalarFieldEnum)[keyof typeof NovelScalarFieldEnum]


  export const ChapterScalarFieldEnum: {
    id: 'id',
    novelId: 'novelId',
    chapterIndex: 'chapterIndex',
    title: 'title',
    sourceUrl: 'sourceUrl',
    status: 'status',
    epubPath: 'epubPath',
    fileSize: 'fileSize',
    checksum: 'checksum',
    retryCount: 'retryCount',
    publishedAt: 'publishedAt',
    lastError: 'lastError',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type ChapterScalarFieldEnum = (typeof ChapterScalarFieldEnum)[keyof typeof ChapterScalarFieldEnum]


  export const SyncRunScalarFieldEnum: {
    id: 'id',
    novelId: 'novelId',
    triggerType: 'triggerType',
    status: 'status',
    totalFound: 'totalFound',
    newChapters: 'newChapters',
    errorMessage: 'errorMessage',
    startedAt: 'startedAt',
    endedAt: 'endedAt',
    createdAt: 'createdAt'
  };

  export type SyncRunScalarFieldEnum = (typeof SyncRunScalarFieldEnum)[keyof typeof SyncRunScalarFieldEnum]


  export const TranslationProjectScalarFieldEnum: {
    id: 'id',
    novelId: 'novelId',
    name: 'name',
    targetLanguage: 'targetLanguage',
    provider: 'provider',
    model: 'model',
    systemPrompt: 'systemPrompt',
    styleGuideJson: 'styleGuideJson',
    contextMode: 'contextMode',
    historyDepth: 'historyDepth',
    autoTranslateNewChapters: 'autoTranslateNewChapters',
    chapterConcurrency: 'chapterConcurrency',
    isActiveAuto: 'isActiveAuto',
    isDefaultEdition: 'isDefaultEdition',
    status: 'status',
    lastError: 'lastError',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type TranslationProjectScalarFieldEnum = (typeof TranslationProjectScalarFieldEnum)[keyof typeof TranslationProjectScalarFieldEnum]


  export const TranslationGlossaryScalarFieldEnum: {
    id: 'id',
    projectId: 'projectId',
    version: 'version',
    sourceType: 'sourceType',
    rawPayload: 'rawPayload',
    isActive: 'isActive',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type TranslationGlossaryScalarFieldEnum = (typeof TranslationGlossaryScalarFieldEnum)[keyof typeof TranslationGlossaryScalarFieldEnum]


  export const TranslationGlossaryEntryScalarFieldEnum: {
    id: 'id',
    glossaryId: 'glossaryId',
    type: 'type',
    rawName: 'rawName',
    translatedName: 'translatedName',
    viLabel: 'viLabel',
    gender: 'gender',
    description: 'description',
    aliasesJson: 'aliasesJson',
    notes: 'notes',
    locked: 'locked',
    priority: 'priority',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type TranslationGlossaryEntryScalarFieldEnum = (typeof TranslationGlossaryEntryScalarFieldEnum)[keyof typeof TranslationGlossaryEntryScalarFieldEnum]


  export const ChapterTranslationScalarFieldEnum: {
    id: 'id',
    projectId: 'projectId',
    chapterId: 'chapterId',
    sourceChecksum: 'sourceChecksum',
    status: 'status',
    currentPublishedVersionId: 'currentPublishedVersionId',
    latestGeneratedVersionId: 'latestGeneratedVersionId',
    hasManualEdits: 'hasManualEdits',
    newGeneratedAvailable: 'newGeneratedAvailable',
    staleReason: 'staleReason',
    lastError: 'lastError',
    retryCount: 'retryCount',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type ChapterTranslationScalarFieldEnum = (typeof ChapterTranslationScalarFieldEnum)[keyof typeof ChapterTranslationScalarFieldEnum]


  export const ChapterTranslationVersionScalarFieldEnum: {
    id: 'id',
    chapterTranslationId: 'chapterTranslationId',
    versionNumber: 'versionNumber',
    kind: 'kind',
    title: 'title',
    htmlPath: 'htmlPath',
    textPath: 'textPath',
    summary: 'summary',
    provider: 'provider',
    model: 'model',
    promptSnapshot: 'promptSnapshot',
    glossaryVersion: 'glossaryVersion',
    sourceChecksum: 'sourceChecksum',
    isPublished: 'isPublished',
    createdBy: 'createdBy',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type ChapterTranslationVersionScalarFieldEnum = (typeof ChapterTranslationVersionScalarFieldEnum)[keyof typeof ChapterTranslationVersionScalarFieldEnum]


  export const TranslationRunScalarFieldEnum: {
    id: 'id',
    projectId: 'projectId',
    triggerType: 'triggerType',
    scope: 'scope',
    status: 'status',
    queuedCount: 'queuedCount',
    completedCount: 'completedCount',
    failedCount: 'failedCount',
    tokenUsage: 'tokenUsage',
    estimatedCost: 'estimatedCost',
    errorMessage: 'errorMessage',
    startedAt: 'startedAt',
    endedAt: 'endedAt',
    createdAt: 'createdAt'
  };

  export type TranslationRunScalarFieldEnum = (typeof TranslationRunScalarFieldEnum)[keyof typeof TranslationRunScalarFieldEnum]


  export const PluginSourceScalarFieldEnum: {
    id: 'id',
    name: 'name',
    enabled: 'enabled',
    version: 'version',
    trustType: 'trustType',
    supportsHome: 'supportsHome',
    supportsSearch: 'supportsSearch',
    supportsGenre: 'supportsGenre',
    supportsPagination: 'supportsPagination',
    supportsDetailDescription: 'supportsDetailDescription',
    supportsBrowserAutomation: 'supportsBrowserAutomation',
    timeoutMs: 'timeoutMs',
    lastCheckedAt: 'lastCheckedAt',
    lastError: 'lastError',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type PluginSourceScalarFieldEnum = (typeof PluginSourceScalarFieldEnum)[keyof typeof PluginSourceScalarFieldEnum]


  export const AppSettingScalarFieldEnum: {
    key: 'key',
    value: 'value',
    updatedAt: 'updatedAt'
  };

  export type AppSettingScalarFieldEnum = (typeof AppSettingScalarFieldEnum)[keyof typeof AppSettingScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    
  /**
   * Deep Input Types
   */


  export type NovelWhereInput = {
    AND?: NovelWhereInput | NovelWhereInput[]
    OR?: NovelWhereInput[]
    NOT?: NovelWhereInput | NovelWhereInput[]
    id?: StringFilter<"Novel"> | string
    title?: StringFilter<"Novel"> | string
    author?: StringNullableFilter<"Novel"> | string | null
    sourceId?: StringFilter<"Novel"> | string
    sourceName?: StringNullableFilter<"Novel"> | string | null
    sourceUrl?: StringFilter<"Novel"> | string
    coverUrl?: StringNullableFilter<"Novel"> | string | null
    coverLocalPath?: StringNullableFilter<"Novel"> | string | null
    description?: StringNullableFilter<"Novel"> | string | null
    status?: StringFilter<"Novel"> | string
    syncStatus?: StringFilter<"Novel"> | string
    totalChapters?: IntFilter<"Novel"> | number
    downloadedChapters?: IntFilter<"Novel"> | number
    defaultEditionKind?: StringFilter<"Novel"> | string
    defaultTranslationProjectId?: StringNullableFilter<"Novel"> | string | null
    lastCheckedAt?: DateTimeNullableFilter<"Novel"> | Date | string | null
    lastSyncStartedAt?: DateTimeNullableFilter<"Novel"> | Date | string | null
    lastSyncEndedAt?: DateTimeNullableFilter<"Novel"> | Date | string | null
    lastError?: StringNullableFilter<"Novel"> | string | null
    createdAt?: DateTimeFilter<"Novel"> | Date | string
    updatedAt?: DateTimeFilter<"Novel"> | Date | string
    chapters?: ChapterListRelationFilter
    syncRuns?: SyncRunListRelationFilter
    translationProjects?: TranslationProjectListRelationFilter
  }

  export type NovelOrderByWithRelationInput = {
    id?: SortOrder
    title?: SortOrder
    author?: SortOrderInput | SortOrder
    sourceId?: SortOrder
    sourceName?: SortOrderInput | SortOrder
    sourceUrl?: SortOrder
    coverUrl?: SortOrderInput | SortOrder
    coverLocalPath?: SortOrderInput | SortOrder
    description?: SortOrderInput | SortOrder
    status?: SortOrder
    syncStatus?: SortOrder
    totalChapters?: SortOrder
    downloadedChapters?: SortOrder
    defaultEditionKind?: SortOrder
    defaultTranslationProjectId?: SortOrderInput | SortOrder
    lastCheckedAt?: SortOrderInput | SortOrder
    lastSyncStartedAt?: SortOrderInput | SortOrder
    lastSyncEndedAt?: SortOrderInput | SortOrder
    lastError?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    chapters?: ChapterOrderByRelationAggregateInput
    syncRuns?: SyncRunOrderByRelationAggregateInput
    translationProjects?: TranslationProjectOrderByRelationAggregateInput
  }

  export type NovelWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: NovelWhereInput | NovelWhereInput[]
    OR?: NovelWhereInput[]
    NOT?: NovelWhereInput | NovelWhereInput[]
    title?: StringFilter<"Novel"> | string
    author?: StringNullableFilter<"Novel"> | string | null
    sourceId?: StringFilter<"Novel"> | string
    sourceName?: StringNullableFilter<"Novel"> | string | null
    sourceUrl?: StringFilter<"Novel"> | string
    coverUrl?: StringNullableFilter<"Novel"> | string | null
    coverLocalPath?: StringNullableFilter<"Novel"> | string | null
    description?: StringNullableFilter<"Novel"> | string | null
    status?: StringFilter<"Novel"> | string
    syncStatus?: StringFilter<"Novel"> | string
    totalChapters?: IntFilter<"Novel"> | number
    downloadedChapters?: IntFilter<"Novel"> | number
    defaultEditionKind?: StringFilter<"Novel"> | string
    defaultTranslationProjectId?: StringNullableFilter<"Novel"> | string | null
    lastCheckedAt?: DateTimeNullableFilter<"Novel"> | Date | string | null
    lastSyncStartedAt?: DateTimeNullableFilter<"Novel"> | Date | string | null
    lastSyncEndedAt?: DateTimeNullableFilter<"Novel"> | Date | string | null
    lastError?: StringNullableFilter<"Novel"> | string | null
    createdAt?: DateTimeFilter<"Novel"> | Date | string
    updatedAt?: DateTimeFilter<"Novel"> | Date | string
    chapters?: ChapterListRelationFilter
    syncRuns?: SyncRunListRelationFilter
    translationProjects?: TranslationProjectListRelationFilter
  }, "id">

  export type NovelOrderByWithAggregationInput = {
    id?: SortOrder
    title?: SortOrder
    author?: SortOrderInput | SortOrder
    sourceId?: SortOrder
    sourceName?: SortOrderInput | SortOrder
    sourceUrl?: SortOrder
    coverUrl?: SortOrderInput | SortOrder
    coverLocalPath?: SortOrderInput | SortOrder
    description?: SortOrderInput | SortOrder
    status?: SortOrder
    syncStatus?: SortOrder
    totalChapters?: SortOrder
    downloadedChapters?: SortOrder
    defaultEditionKind?: SortOrder
    defaultTranslationProjectId?: SortOrderInput | SortOrder
    lastCheckedAt?: SortOrderInput | SortOrder
    lastSyncStartedAt?: SortOrderInput | SortOrder
    lastSyncEndedAt?: SortOrderInput | SortOrder
    lastError?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: NovelCountOrderByAggregateInput
    _avg?: NovelAvgOrderByAggregateInput
    _max?: NovelMaxOrderByAggregateInput
    _min?: NovelMinOrderByAggregateInput
    _sum?: NovelSumOrderByAggregateInput
  }

  export type NovelScalarWhereWithAggregatesInput = {
    AND?: NovelScalarWhereWithAggregatesInput | NovelScalarWhereWithAggregatesInput[]
    OR?: NovelScalarWhereWithAggregatesInput[]
    NOT?: NovelScalarWhereWithAggregatesInput | NovelScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Novel"> | string
    title?: StringWithAggregatesFilter<"Novel"> | string
    author?: StringNullableWithAggregatesFilter<"Novel"> | string | null
    sourceId?: StringWithAggregatesFilter<"Novel"> | string
    sourceName?: StringNullableWithAggregatesFilter<"Novel"> | string | null
    sourceUrl?: StringWithAggregatesFilter<"Novel"> | string
    coverUrl?: StringNullableWithAggregatesFilter<"Novel"> | string | null
    coverLocalPath?: StringNullableWithAggregatesFilter<"Novel"> | string | null
    description?: StringNullableWithAggregatesFilter<"Novel"> | string | null
    status?: StringWithAggregatesFilter<"Novel"> | string
    syncStatus?: StringWithAggregatesFilter<"Novel"> | string
    totalChapters?: IntWithAggregatesFilter<"Novel"> | number
    downloadedChapters?: IntWithAggregatesFilter<"Novel"> | number
    defaultEditionKind?: StringWithAggregatesFilter<"Novel"> | string
    defaultTranslationProjectId?: StringNullableWithAggregatesFilter<"Novel"> | string | null
    lastCheckedAt?: DateTimeNullableWithAggregatesFilter<"Novel"> | Date | string | null
    lastSyncStartedAt?: DateTimeNullableWithAggregatesFilter<"Novel"> | Date | string | null
    lastSyncEndedAt?: DateTimeNullableWithAggregatesFilter<"Novel"> | Date | string | null
    lastError?: StringNullableWithAggregatesFilter<"Novel"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Novel"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Novel"> | Date | string
  }

  export type ChapterWhereInput = {
    AND?: ChapterWhereInput | ChapterWhereInput[]
    OR?: ChapterWhereInput[]
    NOT?: ChapterWhereInput | ChapterWhereInput[]
    id?: StringFilter<"Chapter"> | string
    novelId?: StringFilter<"Chapter"> | string
    chapterIndex?: IntFilter<"Chapter"> | number
    title?: StringFilter<"Chapter"> | string
    sourceUrl?: StringFilter<"Chapter"> | string
    status?: StringFilter<"Chapter"> | string
    epubPath?: StringNullableFilter<"Chapter"> | string | null
    fileSize?: IntNullableFilter<"Chapter"> | number | null
    checksum?: StringNullableFilter<"Chapter"> | string | null
    retryCount?: IntFilter<"Chapter"> | number
    publishedAt?: DateTimeNullableFilter<"Chapter"> | Date | string | null
    lastError?: StringNullableFilter<"Chapter"> | string | null
    createdAt?: DateTimeFilter<"Chapter"> | Date | string
    updatedAt?: DateTimeFilter<"Chapter"> | Date | string
    novel?: XOR<NovelScalarRelationFilter, NovelWhereInput>
    translations?: ChapterTranslationListRelationFilter
  }

  export type ChapterOrderByWithRelationInput = {
    id?: SortOrder
    novelId?: SortOrder
    chapterIndex?: SortOrder
    title?: SortOrder
    sourceUrl?: SortOrder
    status?: SortOrder
    epubPath?: SortOrderInput | SortOrder
    fileSize?: SortOrderInput | SortOrder
    checksum?: SortOrderInput | SortOrder
    retryCount?: SortOrder
    publishedAt?: SortOrderInput | SortOrder
    lastError?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    novel?: NovelOrderByWithRelationInput
    translations?: ChapterTranslationOrderByRelationAggregateInput
  }

  export type ChapterWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    novelId_chapterIndex?: ChapterNovelIdChapterIndexCompoundUniqueInput
    AND?: ChapterWhereInput | ChapterWhereInput[]
    OR?: ChapterWhereInput[]
    NOT?: ChapterWhereInput | ChapterWhereInput[]
    novelId?: StringFilter<"Chapter"> | string
    chapterIndex?: IntFilter<"Chapter"> | number
    title?: StringFilter<"Chapter"> | string
    sourceUrl?: StringFilter<"Chapter"> | string
    status?: StringFilter<"Chapter"> | string
    epubPath?: StringNullableFilter<"Chapter"> | string | null
    fileSize?: IntNullableFilter<"Chapter"> | number | null
    checksum?: StringNullableFilter<"Chapter"> | string | null
    retryCount?: IntFilter<"Chapter"> | number
    publishedAt?: DateTimeNullableFilter<"Chapter"> | Date | string | null
    lastError?: StringNullableFilter<"Chapter"> | string | null
    createdAt?: DateTimeFilter<"Chapter"> | Date | string
    updatedAt?: DateTimeFilter<"Chapter"> | Date | string
    novel?: XOR<NovelScalarRelationFilter, NovelWhereInput>
    translations?: ChapterTranslationListRelationFilter
  }, "id" | "novelId_chapterIndex">

  export type ChapterOrderByWithAggregationInput = {
    id?: SortOrder
    novelId?: SortOrder
    chapterIndex?: SortOrder
    title?: SortOrder
    sourceUrl?: SortOrder
    status?: SortOrder
    epubPath?: SortOrderInput | SortOrder
    fileSize?: SortOrderInput | SortOrder
    checksum?: SortOrderInput | SortOrder
    retryCount?: SortOrder
    publishedAt?: SortOrderInput | SortOrder
    lastError?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: ChapterCountOrderByAggregateInput
    _avg?: ChapterAvgOrderByAggregateInput
    _max?: ChapterMaxOrderByAggregateInput
    _min?: ChapterMinOrderByAggregateInput
    _sum?: ChapterSumOrderByAggregateInput
  }

  export type ChapterScalarWhereWithAggregatesInput = {
    AND?: ChapterScalarWhereWithAggregatesInput | ChapterScalarWhereWithAggregatesInput[]
    OR?: ChapterScalarWhereWithAggregatesInput[]
    NOT?: ChapterScalarWhereWithAggregatesInput | ChapterScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Chapter"> | string
    novelId?: StringWithAggregatesFilter<"Chapter"> | string
    chapterIndex?: IntWithAggregatesFilter<"Chapter"> | number
    title?: StringWithAggregatesFilter<"Chapter"> | string
    sourceUrl?: StringWithAggregatesFilter<"Chapter"> | string
    status?: StringWithAggregatesFilter<"Chapter"> | string
    epubPath?: StringNullableWithAggregatesFilter<"Chapter"> | string | null
    fileSize?: IntNullableWithAggregatesFilter<"Chapter"> | number | null
    checksum?: StringNullableWithAggregatesFilter<"Chapter"> | string | null
    retryCount?: IntWithAggregatesFilter<"Chapter"> | number
    publishedAt?: DateTimeNullableWithAggregatesFilter<"Chapter"> | Date | string | null
    lastError?: StringNullableWithAggregatesFilter<"Chapter"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Chapter"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Chapter"> | Date | string
  }

  export type SyncRunWhereInput = {
    AND?: SyncRunWhereInput | SyncRunWhereInput[]
    OR?: SyncRunWhereInput[]
    NOT?: SyncRunWhereInput | SyncRunWhereInput[]
    id?: StringFilter<"SyncRun"> | string
    novelId?: StringFilter<"SyncRun"> | string
    triggerType?: StringFilter<"SyncRun"> | string
    status?: StringFilter<"SyncRun"> | string
    totalFound?: IntFilter<"SyncRun"> | number
    newChapters?: IntFilter<"SyncRun"> | number
    errorMessage?: StringNullableFilter<"SyncRun"> | string | null
    startedAt?: DateTimeNullableFilter<"SyncRun"> | Date | string | null
    endedAt?: DateTimeNullableFilter<"SyncRun"> | Date | string | null
    createdAt?: DateTimeFilter<"SyncRun"> | Date | string
    novel?: XOR<NovelScalarRelationFilter, NovelWhereInput>
  }

  export type SyncRunOrderByWithRelationInput = {
    id?: SortOrder
    novelId?: SortOrder
    triggerType?: SortOrder
    status?: SortOrder
    totalFound?: SortOrder
    newChapters?: SortOrder
    errorMessage?: SortOrderInput | SortOrder
    startedAt?: SortOrderInput | SortOrder
    endedAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    novel?: NovelOrderByWithRelationInput
  }

  export type SyncRunWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: SyncRunWhereInput | SyncRunWhereInput[]
    OR?: SyncRunWhereInput[]
    NOT?: SyncRunWhereInput | SyncRunWhereInput[]
    novelId?: StringFilter<"SyncRun"> | string
    triggerType?: StringFilter<"SyncRun"> | string
    status?: StringFilter<"SyncRun"> | string
    totalFound?: IntFilter<"SyncRun"> | number
    newChapters?: IntFilter<"SyncRun"> | number
    errorMessage?: StringNullableFilter<"SyncRun"> | string | null
    startedAt?: DateTimeNullableFilter<"SyncRun"> | Date | string | null
    endedAt?: DateTimeNullableFilter<"SyncRun"> | Date | string | null
    createdAt?: DateTimeFilter<"SyncRun"> | Date | string
    novel?: XOR<NovelScalarRelationFilter, NovelWhereInput>
  }, "id">

  export type SyncRunOrderByWithAggregationInput = {
    id?: SortOrder
    novelId?: SortOrder
    triggerType?: SortOrder
    status?: SortOrder
    totalFound?: SortOrder
    newChapters?: SortOrder
    errorMessage?: SortOrderInput | SortOrder
    startedAt?: SortOrderInput | SortOrder
    endedAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    _count?: SyncRunCountOrderByAggregateInput
    _avg?: SyncRunAvgOrderByAggregateInput
    _max?: SyncRunMaxOrderByAggregateInput
    _min?: SyncRunMinOrderByAggregateInput
    _sum?: SyncRunSumOrderByAggregateInput
  }

  export type SyncRunScalarWhereWithAggregatesInput = {
    AND?: SyncRunScalarWhereWithAggregatesInput | SyncRunScalarWhereWithAggregatesInput[]
    OR?: SyncRunScalarWhereWithAggregatesInput[]
    NOT?: SyncRunScalarWhereWithAggregatesInput | SyncRunScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"SyncRun"> | string
    novelId?: StringWithAggregatesFilter<"SyncRun"> | string
    triggerType?: StringWithAggregatesFilter<"SyncRun"> | string
    status?: StringWithAggregatesFilter<"SyncRun"> | string
    totalFound?: IntWithAggregatesFilter<"SyncRun"> | number
    newChapters?: IntWithAggregatesFilter<"SyncRun"> | number
    errorMessage?: StringNullableWithAggregatesFilter<"SyncRun"> | string | null
    startedAt?: DateTimeNullableWithAggregatesFilter<"SyncRun"> | Date | string | null
    endedAt?: DateTimeNullableWithAggregatesFilter<"SyncRun"> | Date | string | null
    createdAt?: DateTimeWithAggregatesFilter<"SyncRun"> | Date | string
  }

  export type TranslationProjectWhereInput = {
    AND?: TranslationProjectWhereInput | TranslationProjectWhereInput[]
    OR?: TranslationProjectWhereInput[]
    NOT?: TranslationProjectWhereInput | TranslationProjectWhereInput[]
    id?: StringFilter<"TranslationProject"> | string
    novelId?: StringFilter<"TranslationProject"> | string
    name?: StringFilter<"TranslationProject"> | string
    targetLanguage?: StringFilter<"TranslationProject"> | string
    provider?: StringFilter<"TranslationProject"> | string
    model?: StringFilter<"TranslationProject"> | string
    systemPrompt?: StringNullableFilter<"TranslationProject"> | string | null
    styleGuideJson?: StringFilter<"TranslationProject"> | string
    contextMode?: StringFilter<"TranslationProject"> | string
    historyDepth?: IntFilter<"TranslationProject"> | number
    autoTranslateNewChapters?: BoolFilter<"TranslationProject"> | boolean
    chapterConcurrency?: IntFilter<"TranslationProject"> | number
    isActiveAuto?: BoolFilter<"TranslationProject"> | boolean
    isDefaultEdition?: BoolFilter<"TranslationProject"> | boolean
    status?: StringFilter<"TranslationProject"> | string
    lastError?: StringNullableFilter<"TranslationProject"> | string | null
    createdAt?: DateTimeFilter<"TranslationProject"> | Date | string
    updatedAt?: DateTimeFilter<"TranslationProject"> | Date | string
    novel?: XOR<NovelScalarRelationFilter, NovelWhereInput>
    glossaries?: TranslationGlossaryListRelationFilter
    chapterTranslations?: ChapterTranslationListRelationFilter
    runs?: TranslationRunListRelationFilter
  }

  export type TranslationProjectOrderByWithRelationInput = {
    id?: SortOrder
    novelId?: SortOrder
    name?: SortOrder
    targetLanguage?: SortOrder
    provider?: SortOrder
    model?: SortOrder
    systemPrompt?: SortOrderInput | SortOrder
    styleGuideJson?: SortOrder
    contextMode?: SortOrder
    historyDepth?: SortOrder
    autoTranslateNewChapters?: SortOrder
    chapterConcurrency?: SortOrder
    isActiveAuto?: SortOrder
    isDefaultEdition?: SortOrder
    status?: SortOrder
    lastError?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    novel?: NovelOrderByWithRelationInput
    glossaries?: TranslationGlossaryOrderByRelationAggregateInput
    chapterTranslations?: ChapterTranslationOrderByRelationAggregateInput
    runs?: TranslationRunOrderByRelationAggregateInput
  }

  export type TranslationProjectWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: TranslationProjectWhereInput | TranslationProjectWhereInput[]
    OR?: TranslationProjectWhereInput[]
    NOT?: TranslationProjectWhereInput | TranslationProjectWhereInput[]
    novelId?: StringFilter<"TranslationProject"> | string
    name?: StringFilter<"TranslationProject"> | string
    targetLanguage?: StringFilter<"TranslationProject"> | string
    provider?: StringFilter<"TranslationProject"> | string
    model?: StringFilter<"TranslationProject"> | string
    systemPrompt?: StringNullableFilter<"TranslationProject"> | string | null
    styleGuideJson?: StringFilter<"TranslationProject"> | string
    contextMode?: StringFilter<"TranslationProject"> | string
    historyDepth?: IntFilter<"TranslationProject"> | number
    autoTranslateNewChapters?: BoolFilter<"TranslationProject"> | boolean
    chapterConcurrency?: IntFilter<"TranslationProject"> | number
    isActiveAuto?: BoolFilter<"TranslationProject"> | boolean
    isDefaultEdition?: BoolFilter<"TranslationProject"> | boolean
    status?: StringFilter<"TranslationProject"> | string
    lastError?: StringNullableFilter<"TranslationProject"> | string | null
    createdAt?: DateTimeFilter<"TranslationProject"> | Date | string
    updatedAt?: DateTimeFilter<"TranslationProject"> | Date | string
    novel?: XOR<NovelScalarRelationFilter, NovelWhereInput>
    glossaries?: TranslationGlossaryListRelationFilter
    chapterTranslations?: ChapterTranslationListRelationFilter
    runs?: TranslationRunListRelationFilter
  }, "id">

  export type TranslationProjectOrderByWithAggregationInput = {
    id?: SortOrder
    novelId?: SortOrder
    name?: SortOrder
    targetLanguage?: SortOrder
    provider?: SortOrder
    model?: SortOrder
    systemPrompt?: SortOrderInput | SortOrder
    styleGuideJson?: SortOrder
    contextMode?: SortOrder
    historyDepth?: SortOrder
    autoTranslateNewChapters?: SortOrder
    chapterConcurrency?: SortOrder
    isActiveAuto?: SortOrder
    isDefaultEdition?: SortOrder
    status?: SortOrder
    lastError?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: TranslationProjectCountOrderByAggregateInput
    _avg?: TranslationProjectAvgOrderByAggregateInput
    _max?: TranslationProjectMaxOrderByAggregateInput
    _min?: TranslationProjectMinOrderByAggregateInput
    _sum?: TranslationProjectSumOrderByAggregateInput
  }

  export type TranslationProjectScalarWhereWithAggregatesInput = {
    AND?: TranslationProjectScalarWhereWithAggregatesInput | TranslationProjectScalarWhereWithAggregatesInput[]
    OR?: TranslationProjectScalarWhereWithAggregatesInput[]
    NOT?: TranslationProjectScalarWhereWithAggregatesInput | TranslationProjectScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"TranslationProject"> | string
    novelId?: StringWithAggregatesFilter<"TranslationProject"> | string
    name?: StringWithAggregatesFilter<"TranslationProject"> | string
    targetLanguage?: StringWithAggregatesFilter<"TranslationProject"> | string
    provider?: StringWithAggregatesFilter<"TranslationProject"> | string
    model?: StringWithAggregatesFilter<"TranslationProject"> | string
    systemPrompt?: StringNullableWithAggregatesFilter<"TranslationProject"> | string | null
    styleGuideJson?: StringWithAggregatesFilter<"TranslationProject"> | string
    contextMode?: StringWithAggregatesFilter<"TranslationProject"> | string
    historyDepth?: IntWithAggregatesFilter<"TranslationProject"> | number
    autoTranslateNewChapters?: BoolWithAggregatesFilter<"TranslationProject"> | boolean
    chapterConcurrency?: IntWithAggregatesFilter<"TranslationProject"> | number
    isActiveAuto?: BoolWithAggregatesFilter<"TranslationProject"> | boolean
    isDefaultEdition?: BoolWithAggregatesFilter<"TranslationProject"> | boolean
    status?: StringWithAggregatesFilter<"TranslationProject"> | string
    lastError?: StringNullableWithAggregatesFilter<"TranslationProject"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"TranslationProject"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"TranslationProject"> | Date | string
  }

  export type TranslationGlossaryWhereInput = {
    AND?: TranslationGlossaryWhereInput | TranslationGlossaryWhereInput[]
    OR?: TranslationGlossaryWhereInput[]
    NOT?: TranslationGlossaryWhereInput | TranslationGlossaryWhereInput[]
    id?: StringFilter<"TranslationGlossary"> | string
    projectId?: StringFilter<"TranslationGlossary"> | string
    version?: IntFilter<"TranslationGlossary"> | number
    sourceType?: StringFilter<"TranslationGlossary"> | string
    rawPayload?: StringFilter<"TranslationGlossary"> | string
    isActive?: BoolFilter<"TranslationGlossary"> | boolean
    createdAt?: DateTimeFilter<"TranslationGlossary"> | Date | string
    updatedAt?: DateTimeFilter<"TranslationGlossary"> | Date | string
    project?: XOR<TranslationProjectScalarRelationFilter, TranslationProjectWhereInput>
    entries?: TranslationGlossaryEntryListRelationFilter
  }

  export type TranslationGlossaryOrderByWithRelationInput = {
    id?: SortOrder
    projectId?: SortOrder
    version?: SortOrder
    sourceType?: SortOrder
    rawPayload?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    project?: TranslationProjectOrderByWithRelationInput
    entries?: TranslationGlossaryEntryOrderByRelationAggregateInput
  }

  export type TranslationGlossaryWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    projectId_version?: TranslationGlossaryProjectIdVersionCompoundUniqueInput
    AND?: TranslationGlossaryWhereInput | TranslationGlossaryWhereInput[]
    OR?: TranslationGlossaryWhereInput[]
    NOT?: TranslationGlossaryWhereInput | TranslationGlossaryWhereInput[]
    projectId?: StringFilter<"TranslationGlossary"> | string
    version?: IntFilter<"TranslationGlossary"> | number
    sourceType?: StringFilter<"TranslationGlossary"> | string
    rawPayload?: StringFilter<"TranslationGlossary"> | string
    isActive?: BoolFilter<"TranslationGlossary"> | boolean
    createdAt?: DateTimeFilter<"TranslationGlossary"> | Date | string
    updatedAt?: DateTimeFilter<"TranslationGlossary"> | Date | string
    project?: XOR<TranslationProjectScalarRelationFilter, TranslationProjectWhereInput>
    entries?: TranslationGlossaryEntryListRelationFilter
  }, "id" | "projectId_version">

  export type TranslationGlossaryOrderByWithAggregationInput = {
    id?: SortOrder
    projectId?: SortOrder
    version?: SortOrder
    sourceType?: SortOrder
    rawPayload?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: TranslationGlossaryCountOrderByAggregateInput
    _avg?: TranslationGlossaryAvgOrderByAggregateInput
    _max?: TranslationGlossaryMaxOrderByAggregateInput
    _min?: TranslationGlossaryMinOrderByAggregateInput
    _sum?: TranslationGlossarySumOrderByAggregateInput
  }

  export type TranslationGlossaryScalarWhereWithAggregatesInput = {
    AND?: TranslationGlossaryScalarWhereWithAggregatesInput | TranslationGlossaryScalarWhereWithAggregatesInput[]
    OR?: TranslationGlossaryScalarWhereWithAggregatesInput[]
    NOT?: TranslationGlossaryScalarWhereWithAggregatesInput | TranslationGlossaryScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"TranslationGlossary"> | string
    projectId?: StringWithAggregatesFilter<"TranslationGlossary"> | string
    version?: IntWithAggregatesFilter<"TranslationGlossary"> | number
    sourceType?: StringWithAggregatesFilter<"TranslationGlossary"> | string
    rawPayload?: StringWithAggregatesFilter<"TranslationGlossary"> | string
    isActive?: BoolWithAggregatesFilter<"TranslationGlossary"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"TranslationGlossary"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"TranslationGlossary"> | Date | string
  }

  export type TranslationGlossaryEntryWhereInput = {
    AND?: TranslationGlossaryEntryWhereInput | TranslationGlossaryEntryWhereInput[]
    OR?: TranslationGlossaryEntryWhereInput[]
    NOT?: TranslationGlossaryEntryWhereInput | TranslationGlossaryEntryWhereInput[]
    id?: StringFilter<"TranslationGlossaryEntry"> | string
    glossaryId?: StringFilter<"TranslationGlossaryEntry"> | string
    type?: StringFilter<"TranslationGlossaryEntry"> | string
    rawName?: StringFilter<"TranslationGlossaryEntry"> | string
    translatedName?: StringFilter<"TranslationGlossaryEntry"> | string
    viLabel?: StringNullableFilter<"TranslationGlossaryEntry"> | string | null
    gender?: StringNullableFilter<"TranslationGlossaryEntry"> | string | null
    description?: StringNullableFilter<"TranslationGlossaryEntry"> | string | null
    aliasesJson?: StringFilter<"TranslationGlossaryEntry"> | string
    notes?: StringNullableFilter<"TranslationGlossaryEntry"> | string | null
    locked?: BoolFilter<"TranslationGlossaryEntry"> | boolean
    priority?: IntFilter<"TranslationGlossaryEntry"> | number
    createdAt?: DateTimeFilter<"TranslationGlossaryEntry"> | Date | string
    updatedAt?: DateTimeFilter<"TranslationGlossaryEntry"> | Date | string
    glossary?: XOR<TranslationGlossaryScalarRelationFilter, TranslationGlossaryWhereInput>
  }

  export type TranslationGlossaryEntryOrderByWithRelationInput = {
    id?: SortOrder
    glossaryId?: SortOrder
    type?: SortOrder
    rawName?: SortOrder
    translatedName?: SortOrder
    viLabel?: SortOrderInput | SortOrder
    gender?: SortOrderInput | SortOrder
    description?: SortOrderInput | SortOrder
    aliasesJson?: SortOrder
    notes?: SortOrderInput | SortOrder
    locked?: SortOrder
    priority?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    glossary?: TranslationGlossaryOrderByWithRelationInput
  }

  export type TranslationGlossaryEntryWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: TranslationGlossaryEntryWhereInput | TranslationGlossaryEntryWhereInput[]
    OR?: TranslationGlossaryEntryWhereInput[]
    NOT?: TranslationGlossaryEntryWhereInput | TranslationGlossaryEntryWhereInput[]
    glossaryId?: StringFilter<"TranslationGlossaryEntry"> | string
    type?: StringFilter<"TranslationGlossaryEntry"> | string
    rawName?: StringFilter<"TranslationGlossaryEntry"> | string
    translatedName?: StringFilter<"TranslationGlossaryEntry"> | string
    viLabel?: StringNullableFilter<"TranslationGlossaryEntry"> | string | null
    gender?: StringNullableFilter<"TranslationGlossaryEntry"> | string | null
    description?: StringNullableFilter<"TranslationGlossaryEntry"> | string | null
    aliasesJson?: StringFilter<"TranslationGlossaryEntry"> | string
    notes?: StringNullableFilter<"TranslationGlossaryEntry"> | string | null
    locked?: BoolFilter<"TranslationGlossaryEntry"> | boolean
    priority?: IntFilter<"TranslationGlossaryEntry"> | number
    createdAt?: DateTimeFilter<"TranslationGlossaryEntry"> | Date | string
    updatedAt?: DateTimeFilter<"TranslationGlossaryEntry"> | Date | string
    glossary?: XOR<TranslationGlossaryScalarRelationFilter, TranslationGlossaryWhereInput>
  }, "id">

  export type TranslationGlossaryEntryOrderByWithAggregationInput = {
    id?: SortOrder
    glossaryId?: SortOrder
    type?: SortOrder
    rawName?: SortOrder
    translatedName?: SortOrder
    viLabel?: SortOrderInput | SortOrder
    gender?: SortOrderInput | SortOrder
    description?: SortOrderInput | SortOrder
    aliasesJson?: SortOrder
    notes?: SortOrderInput | SortOrder
    locked?: SortOrder
    priority?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: TranslationGlossaryEntryCountOrderByAggregateInput
    _avg?: TranslationGlossaryEntryAvgOrderByAggregateInput
    _max?: TranslationGlossaryEntryMaxOrderByAggregateInput
    _min?: TranslationGlossaryEntryMinOrderByAggregateInput
    _sum?: TranslationGlossaryEntrySumOrderByAggregateInput
  }

  export type TranslationGlossaryEntryScalarWhereWithAggregatesInput = {
    AND?: TranslationGlossaryEntryScalarWhereWithAggregatesInput | TranslationGlossaryEntryScalarWhereWithAggregatesInput[]
    OR?: TranslationGlossaryEntryScalarWhereWithAggregatesInput[]
    NOT?: TranslationGlossaryEntryScalarWhereWithAggregatesInput | TranslationGlossaryEntryScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"TranslationGlossaryEntry"> | string
    glossaryId?: StringWithAggregatesFilter<"TranslationGlossaryEntry"> | string
    type?: StringWithAggregatesFilter<"TranslationGlossaryEntry"> | string
    rawName?: StringWithAggregatesFilter<"TranslationGlossaryEntry"> | string
    translatedName?: StringWithAggregatesFilter<"TranslationGlossaryEntry"> | string
    viLabel?: StringNullableWithAggregatesFilter<"TranslationGlossaryEntry"> | string | null
    gender?: StringNullableWithAggregatesFilter<"TranslationGlossaryEntry"> | string | null
    description?: StringNullableWithAggregatesFilter<"TranslationGlossaryEntry"> | string | null
    aliasesJson?: StringWithAggregatesFilter<"TranslationGlossaryEntry"> | string
    notes?: StringNullableWithAggregatesFilter<"TranslationGlossaryEntry"> | string | null
    locked?: BoolWithAggregatesFilter<"TranslationGlossaryEntry"> | boolean
    priority?: IntWithAggregatesFilter<"TranslationGlossaryEntry"> | number
    createdAt?: DateTimeWithAggregatesFilter<"TranslationGlossaryEntry"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"TranslationGlossaryEntry"> | Date | string
  }

  export type ChapterTranslationWhereInput = {
    AND?: ChapterTranslationWhereInput | ChapterTranslationWhereInput[]
    OR?: ChapterTranslationWhereInput[]
    NOT?: ChapterTranslationWhereInput | ChapterTranslationWhereInput[]
    id?: StringFilter<"ChapterTranslation"> | string
    projectId?: StringFilter<"ChapterTranslation"> | string
    chapterId?: StringFilter<"ChapterTranslation"> | string
    sourceChecksum?: StringFilter<"ChapterTranslation"> | string
    status?: StringFilter<"ChapterTranslation"> | string
    currentPublishedVersionId?: StringNullableFilter<"ChapterTranslation"> | string | null
    latestGeneratedVersionId?: StringNullableFilter<"ChapterTranslation"> | string | null
    hasManualEdits?: BoolFilter<"ChapterTranslation"> | boolean
    newGeneratedAvailable?: BoolFilter<"ChapterTranslation"> | boolean
    staleReason?: StringNullableFilter<"ChapterTranslation"> | string | null
    lastError?: StringNullableFilter<"ChapterTranslation"> | string | null
    retryCount?: IntFilter<"ChapterTranslation"> | number
    createdAt?: DateTimeFilter<"ChapterTranslation"> | Date | string
    updatedAt?: DateTimeFilter<"ChapterTranslation"> | Date | string
    project?: XOR<TranslationProjectScalarRelationFilter, TranslationProjectWhereInput>
    chapter?: XOR<ChapterScalarRelationFilter, ChapterWhereInput>
    versions?: ChapterTranslationVersionListRelationFilter
  }

  export type ChapterTranslationOrderByWithRelationInput = {
    id?: SortOrder
    projectId?: SortOrder
    chapterId?: SortOrder
    sourceChecksum?: SortOrder
    status?: SortOrder
    currentPublishedVersionId?: SortOrderInput | SortOrder
    latestGeneratedVersionId?: SortOrderInput | SortOrder
    hasManualEdits?: SortOrder
    newGeneratedAvailable?: SortOrder
    staleReason?: SortOrderInput | SortOrder
    lastError?: SortOrderInput | SortOrder
    retryCount?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    project?: TranslationProjectOrderByWithRelationInput
    chapter?: ChapterOrderByWithRelationInput
    versions?: ChapterTranslationVersionOrderByRelationAggregateInput
  }

  export type ChapterTranslationWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    projectId_chapterId?: ChapterTranslationProjectIdChapterIdCompoundUniqueInput
    AND?: ChapterTranslationWhereInput | ChapterTranslationWhereInput[]
    OR?: ChapterTranslationWhereInput[]
    NOT?: ChapterTranslationWhereInput | ChapterTranslationWhereInput[]
    projectId?: StringFilter<"ChapterTranslation"> | string
    chapterId?: StringFilter<"ChapterTranslation"> | string
    sourceChecksum?: StringFilter<"ChapterTranslation"> | string
    status?: StringFilter<"ChapterTranslation"> | string
    currentPublishedVersionId?: StringNullableFilter<"ChapterTranslation"> | string | null
    latestGeneratedVersionId?: StringNullableFilter<"ChapterTranslation"> | string | null
    hasManualEdits?: BoolFilter<"ChapterTranslation"> | boolean
    newGeneratedAvailable?: BoolFilter<"ChapterTranslation"> | boolean
    staleReason?: StringNullableFilter<"ChapterTranslation"> | string | null
    lastError?: StringNullableFilter<"ChapterTranslation"> | string | null
    retryCount?: IntFilter<"ChapterTranslation"> | number
    createdAt?: DateTimeFilter<"ChapterTranslation"> | Date | string
    updatedAt?: DateTimeFilter<"ChapterTranslation"> | Date | string
    project?: XOR<TranslationProjectScalarRelationFilter, TranslationProjectWhereInput>
    chapter?: XOR<ChapterScalarRelationFilter, ChapterWhereInput>
    versions?: ChapterTranslationVersionListRelationFilter
  }, "id" | "projectId_chapterId">

  export type ChapterTranslationOrderByWithAggregationInput = {
    id?: SortOrder
    projectId?: SortOrder
    chapterId?: SortOrder
    sourceChecksum?: SortOrder
    status?: SortOrder
    currentPublishedVersionId?: SortOrderInput | SortOrder
    latestGeneratedVersionId?: SortOrderInput | SortOrder
    hasManualEdits?: SortOrder
    newGeneratedAvailable?: SortOrder
    staleReason?: SortOrderInput | SortOrder
    lastError?: SortOrderInput | SortOrder
    retryCount?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: ChapterTranslationCountOrderByAggregateInput
    _avg?: ChapterTranslationAvgOrderByAggregateInput
    _max?: ChapterTranslationMaxOrderByAggregateInput
    _min?: ChapterTranslationMinOrderByAggregateInput
    _sum?: ChapterTranslationSumOrderByAggregateInput
  }

  export type ChapterTranslationScalarWhereWithAggregatesInput = {
    AND?: ChapterTranslationScalarWhereWithAggregatesInput | ChapterTranslationScalarWhereWithAggregatesInput[]
    OR?: ChapterTranslationScalarWhereWithAggregatesInput[]
    NOT?: ChapterTranslationScalarWhereWithAggregatesInput | ChapterTranslationScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"ChapterTranslation"> | string
    projectId?: StringWithAggregatesFilter<"ChapterTranslation"> | string
    chapterId?: StringWithAggregatesFilter<"ChapterTranslation"> | string
    sourceChecksum?: StringWithAggregatesFilter<"ChapterTranslation"> | string
    status?: StringWithAggregatesFilter<"ChapterTranslation"> | string
    currentPublishedVersionId?: StringNullableWithAggregatesFilter<"ChapterTranslation"> | string | null
    latestGeneratedVersionId?: StringNullableWithAggregatesFilter<"ChapterTranslation"> | string | null
    hasManualEdits?: BoolWithAggregatesFilter<"ChapterTranslation"> | boolean
    newGeneratedAvailable?: BoolWithAggregatesFilter<"ChapterTranslation"> | boolean
    staleReason?: StringNullableWithAggregatesFilter<"ChapterTranslation"> | string | null
    lastError?: StringNullableWithAggregatesFilter<"ChapterTranslation"> | string | null
    retryCount?: IntWithAggregatesFilter<"ChapterTranslation"> | number
    createdAt?: DateTimeWithAggregatesFilter<"ChapterTranslation"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"ChapterTranslation"> | Date | string
  }

  export type ChapterTranslationVersionWhereInput = {
    AND?: ChapterTranslationVersionWhereInput | ChapterTranslationVersionWhereInput[]
    OR?: ChapterTranslationVersionWhereInput[]
    NOT?: ChapterTranslationVersionWhereInput | ChapterTranslationVersionWhereInput[]
    id?: StringFilter<"ChapterTranslationVersion"> | string
    chapterTranslationId?: StringFilter<"ChapterTranslationVersion"> | string
    versionNumber?: IntFilter<"ChapterTranslationVersion"> | number
    kind?: StringFilter<"ChapterTranslationVersion"> | string
    title?: StringNullableFilter<"ChapterTranslationVersion"> | string | null
    htmlPath?: StringFilter<"ChapterTranslationVersion"> | string
    textPath?: StringNullableFilter<"ChapterTranslationVersion"> | string | null
    summary?: StringNullableFilter<"ChapterTranslationVersion"> | string | null
    provider?: StringNullableFilter<"ChapterTranslationVersion"> | string | null
    model?: StringNullableFilter<"ChapterTranslationVersion"> | string | null
    promptSnapshot?: StringNullableFilter<"ChapterTranslationVersion"> | string | null
    glossaryVersion?: IntNullableFilter<"ChapterTranslationVersion"> | number | null
    sourceChecksum?: StringFilter<"ChapterTranslationVersion"> | string
    isPublished?: BoolFilter<"ChapterTranslationVersion"> | boolean
    createdBy?: StringFilter<"ChapterTranslationVersion"> | string
    createdAt?: DateTimeFilter<"ChapterTranslationVersion"> | Date | string
    updatedAt?: DateTimeFilter<"ChapterTranslationVersion"> | Date | string
    chapterTranslation?: XOR<ChapterTranslationScalarRelationFilter, ChapterTranslationWhereInput>
  }

  export type ChapterTranslationVersionOrderByWithRelationInput = {
    id?: SortOrder
    chapterTranslationId?: SortOrder
    versionNumber?: SortOrder
    kind?: SortOrder
    title?: SortOrderInput | SortOrder
    htmlPath?: SortOrder
    textPath?: SortOrderInput | SortOrder
    summary?: SortOrderInput | SortOrder
    provider?: SortOrderInput | SortOrder
    model?: SortOrderInput | SortOrder
    promptSnapshot?: SortOrderInput | SortOrder
    glossaryVersion?: SortOrderInput | SortOrder
    sourceChecksum?: SortOrder
    isPublished?: SortOrder
    createdBy?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    chapterTranslation?: ChapterTranslationOrderByWithRelationInput
  }

  export type ChapterTranslationVersionWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    chapterTranslationId_versionNumber?: ChapterTranslationVersionChapterTranslationIdVersionNumberCompoundUniqueInput
    AND?: ChapterTranslationVersionWhereInput | ChapterTranslationVersionWhereInput[]
    OR?: ChapterTranslationVersionWhereInput[]
    NOT?: ChapterTranslationVersionWhereInput | ChapterTranslationVersionWhereInput[]
    chapterTranslationId?: StringFilter<"ChapterTranslationVersion"> | string
    versionNumber?: IntFilter<"ChapterTranslationVersion"> | number
    kind?: StringFilter<"ChapterTranslationVersion"> | string
    title?: StringNullableFilter<"ChapterTranslationVersion"> | string | null
    htmlPath?: StringFilter<"ChapterTranslationVersion"> | string
    textPath?: StringNullableFilter<"ChapterTranslationVersion"> | string | null
    summary?: StringNullableFilter<"ChapterTranslationVersion"> | string | null
    provider?: StringNullableFilter<"ChapterTranslationVersion"> | string | null
    model?: StringNullableFilter<"ChapterTranslationVersion"> | string | null
    promptSnapshot?: StringNullableFilter<"ChapterTranslationVersion"> | string | null
    glossaryVersion?: IntNullableFilter<"ChapterTranslationVersion"> | number | null
    sourceChecksum?: StringFilter<"ChapterTranslationVersion"> | string
    isPublished?: BoolFilter<"ChapterTranslationVersion"> | boolean
    createdBy?: StringFilter<"ChapterTranslationVersion"> | string
    createdAt?: DateTimeFilter<"ChapterTranslationVersion"> | Date | string
    updatedAt?: DateTimeFilter<"ChapterTranslationVersion"> | Date | string
    chapterTranslation?: XOR<ChapterTranslationScalarRelationFilter, ChapterTranslationWhereInput>
  }, "id" | "chapterTranslationId_versionNumber">

  export type ChapterTranslationVersionOrderByWithAggregationInput = {
    id?: SortOrder
    chapterTranslationId?: SortOrder
    versionNumber?: SortOrder
    kind?: SortOrder
    title?: SortOrderInput | SortOrder
    htmlPath?: SortOrder
    textPath?: SortOrderInput | SortOrder
    summary?: SortOrderInput | SortOrder
    provider?: SortOrderInput | SortOrder
    model?: SortOrderInput | SortOrder
    promptSnapshot?: SortOrderInput | SortOrder
    glossaryVersion?: SortOrderInput | SortOrder
    sourceChecksum?: SortOrder
    isPublished?: SortOrder
    createdBy?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: ChapterTranslationVersionCountOrderByAggregateInput
    _avg?: ChapterTranslationVersionAvgOrderByAggregateInput
    _max?: ChapterTranslationVersionMaxOrderByAggregateInput
    _min?: ChapterTranslationVersionMinOrderByAggregateInput
    _sum?: ChapterTranslationVersionSumOrderByAggregateInput
  }

  export type ChapterTranslationVersionScalarWhereWithAggregatesInput = {
    AND?: ChapterTranslationVersionScalarWhereWithAggregatesInput | ChapterTranslationVersionScalarWhereWithAggregatesInput[]
    OR?: ChapterTranslationVersionScalarWhereWithAggregatesInput[]
    NOT?: ChapterTranslationVersionScalarWhereWithAggregatesInput | ChapterTranslationVersionScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"ChapterTranslationVersion"> | string
    chapterTranslationId?: StringWithAggregatesFilter<"ChapterTranslationVersion"> | string
    versionNumber?: IntWithAggregatesFilter<"ChapterTranslationVersion"> | number
    kind?: StringWithAggregatesFilter<"ChapterTranslationVersion"> | string
    title?: StringNullableWithAggregatesFilter<"ChapterTranslationVersion"> | string | null
    htmlPath?: StringWithAggregatesFilter<"ChapterTranslationVersion"> | string
    textPath?: StringNullableWithAggregatesFilter<"ChapterTranslationVersion"> | string | null
    summary?: StringNullableWithAggregatesFilter<"ChapterTranslationVersion"> | string | null
    provider?: StringNullableWithAggregatesFilter<"ChapterTranslationVersion"> | string | null
    model?: StringNullableWithAggregatesFilter<"ChapterTranslationVersion"> | string | null
    promptSnapshot?: StringNullableWithAggregatesFilter<"ChapterTranslationVersion"> | string | null
    glossaryVersion?: IntNullableWithAggregatesFilter<"ChapterTranslationVersion"> | number | null
    sourceChecksum?: StringWithAggregatesFilter<"ChapterTranslationVersion"> | string
    isPublished?: BoolWithAggregatesFilter<"ChapterTranslationVersion"> | boolean
    createdBy?: StringWithAggregatesFilter<"ChapterTranslationVersion"> | string
    createdAt?: DateTimeWithAggregatesFilter<"ChapterTranslationVersion"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"ChapterTranslationVersion"> | Date | string
  }

  export type TranslationRunWhereInput = {
    AND?: TranslationRunWhereInput | TranslationRunWhereInput[]
    OR?: TranslationRunWhereInput[]
    NOT?: TranslationRunWhereInput | TranslationRunWhereInput[]
    id?: StringFilter<"TranslationRun"> | string
    projectId?: StringFilter<"TranslationRun"> | string
    triggerType?: StringFilter<"TranslationRun"> | string
    scope?: StringFilter<"TranslationRun"> | string
    status?: StringFilter<"TranslationRun"> | string
    queuedCount?: IntFilter<"TranslationRun"> | number
    completedCount?: IntFilter<"TranslationRun"> | number
    failedCount?: IntFilter<"TranslationRun"> | number
    tokenUsage?: IntFilter<"TranslationRun"> | number
    estimatedCost?: FloatFilter<"TranslationRun"> | number
    errorMessage?: StringNullableFilter<"TranslationRun"> | string | null
    startedAt?: DateTimeNullableFilter<"TranslationRun"> | Date | string | null
    endedAt?: DateTimeNullableFilter<"TranslationRun"> | Date | string | null
    createdAt?: DateTimeFilter<"TranslationRun"> | Date | string
    project?: XOR<TranslationProjectScalarRelationFilter, TranslationProjectWhereInput>
  }

  export type TranslationRunOrderByWithRelationInput = {
    id?: SortOrder
    projectId?: SortOrder
    triggerType?: SortOrder
    scope?: SortOrder
    status?: SortOrder
    queuedCount?: SortOrder
    completedCount?: SortOrder
    failedCount?: SortOrder
    tokenUsage?: SortOrder
    estimatedCost?: SortOrder
    errorMessage?: SortOrderInput | SortOrder
    startedAt?: SortOrderInput | SortOrder
    endedAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    project?: TranslationProjectOrderByWithRelationInput
  }

  export type TranslationRunWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: TranslationRunWhereInput | TranslationRunWhereInput[]
    OR?: TranslationRunWhereInput[]
    NOT?: TranslationRunWhereInput | TranslationRunWhereInput[]
    projectId?: StringFilter<"TranslationRun"> | string
    triggerType?: StringFilter<"TranslationRun"> | string
    scope?: StringFilter<"TranslationRun"> | string
    status?: StringFilter<"TranslationRun"> | string
    queuedCount?: IntFilter<"TranslationRun"> | number
    completedCount?: IntFilter<"TranslationRun"> | number
    failedCount?: IntFilter<"TranslationRun"> | number
    tokenUsage?: IntFilter<"TranslationRun"> | number
    estimatedCost?: FloatFilter<"TranslationRun"> | number
    errorMessage?: StringNullableFilter<"TranslationRun"> | string | null
    startedAt?: DateTimeNullableFilter<"TranslationRun"> | Date | string | null
    endedAt?: DateTimeNullableFilter<"TranslationRun"> | Date | string | null
    createdAt?: DateTimeFilter<"TranslationRun"> | Date | string
    project?: XOR<TranslationProjectScalarRelationFilter, TranslationProjectWhereInput>
  }, "id">

  export type TranslationRunOrderByWithAggregationInput = {
    id?: SortOrder
    projectId?: SortOrder
    triggerType?: SortOrder
    scope?: SortOrder
    status?: SortOrder
    queuedCount?: SortOrder
    completedCount?: SortOrder
    failedCount?: SortOrder
    tokenUsage?: SortOrder
    estimatedCost?: SortOrder
    errorMessage?: SortOrderInput | SortOrder
    startedAt?: SortOrderInput | SortOrder
    endedAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    _count?: TranslationRunCountOrderByAggregateInput
    _avg?: TranslationRunAvgOrderByAggregateInput
    _max?: TranslationRunMaxOrderByAggregateInput
    _min?: TranslationRunMinOrderByAggregateInput
    _sum?: TranslationRunSumOrderByAggregateInput
  }

  export type TranslationRunScalarWhereWithAggregatesInput = {
    AND?: TranslationRunScalarWhereWithAggregatesInput | TranslationRunScalarWhereWithAggregatesInput[]
    OR?: TranslationRunScalarWhereWithAggregatesInput[]
    NOT?: TranslationRunScalarWhereWithAggregatesInput | TranslationRunScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"TranslationRun"> | string
    projectId?: StringWithAggregatesFilter<"TranslationRun"> | string
    triggerType?: StringWithAggregatesFilter<"TranslationRun"> | string
    scope?: StringWithAggregatesFilter<"TranslationRun"> | string
    status?: StringWithAggregatesFilter<"TranslationRun"> | string
    queuedCount?: IntWithAggregatesFilter<"TranslationRun"> | number
    completedCount?: IntWithAggregatesFilter<"TranslationRun"> | number
    failedCount?: IntWithAggregatesFilter<"TranslationRun"> | number
    tokenUsage?: IntWithAggregatesFilter<"TranslationRun"> | number
    estimatedCost?: FloatWithAggregatesFilter<"TranslationRun"> | number
    errorMessage?: StringNullableWithAggregatesFilter<"TranslationRun"> | string | null
    startedAt?: DateTimeNullableWithAggregatesFilter<"TranslationRun"> | Date | string | null
    endedAt?: DateTimeNullableWithAggregatesFilter<"TranslationRun"> | Date | string | null
    createdAt?: DateTimeWithAggregatesFilter<"TranslationRun"> | Date | string
  }

  export type PluginSourceWhereInput = {
    AND?: PluginSourceWhereInput | PluginSourceWhereInput[]
    OR?: PluginSourceWhereInput[]
    NOT?: PluginSourceWhereInput | PluginSourceWhereInput[]
    id?: StringFilter<"PluginSource"> | string
    name?: StringFilter<"PluginSource"> | string
    enabled?: BoolFilter<"PluginSource"> | boolean
    version?: StringNullableFilter<"PluginSource"> | string | null
    trustType?: StringFilter<"PluginSource"> | string
    supportsHome?: BoolFilter<"PluginSource"> | boolean
    supportsSearch?: BoolFilter<"PluginSource"> | boolean
    supportsGenre?: BoolFilter<"PluginSource"> | boolean
    supportsPagination?: BoolFilter<"PluginSource"> | boolean
    supportsDetailDescription?: BoolFilter<"PluginSource"> | boolean
    supportsBrowserAutomation?: BoolFilter<"PluginSource"> | boolean
    timeoutMs?: IntFilter<"PluginSource"> | number
    lastCheckedAt?: DateTimeNullableFilter<"PluginSource"> | Date | string | null
    lastError?: StringNullableFilter<"PluginSource"> | string | null
    createdAt?: DateTimeFilter<"PluginSource"> | Date | string
    updatedAt?: DateTimeFilter<"PluginSource"> | Date | string
  }

  export type PluginSourceOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    enabled?: SortOrder
    version?: SortOrderInput | SortOrder
    trustType?: SortOrder
    supportsHome?: SortOrder
    supportsSearch?: SortOrder
    supportsGenre?: SortOrder
    supportsPagination?: SortOrder
    supportsDetailDescription?: SortOrder
    supportsBrowserAutomation?: SortOrder
    timeoutMs?: SortOrder
    lastCheckedAt?: SortOrderInput | SortOrder
    lastError?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PluginSourceWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: PluginSourceWhereInput | PluginSourceWhereInput[]
    OR?: PluginSourceWhereInput[]
    NOT?: PluginSourceWhereInput | PluginSourceWhereInput[]
    name?: StringFilter<"PluginSource"> | string
    enabled?: BoolFilter<"PluginSource"> | boolean
    version?: StringNullableFilter<"PluginSource"> | string | null
    trustType?: StringFilter<"PluginSource"> | string
    supportsHome?: BoolFilter<"PluginSource"> | boolean
    supportsSearch?: BoolFilter<"PluginSource"> | boolean
    supportsGenre?: BoolFilter<"PluginSource"> | boolean
    supportsPagination?: BoolFilter<"PluginSource"> | boolean
    supportsDetailDescription?: BoolFilter<"PluginSource"> | boolean
    supportsBrowserAutomation?: BoolFilter<"PluginSource"> | boolean
    timeoutMs?: IntFilter<"PluginSource"> | number
    lastCheckedAt?: DateTimeNullableFilter<"PluginSource"> | Date | string | null
    lastError?: StringNullableFilter<"PluginSource"> | string | null
    createdAt?: DateTimeFilter<"PluginSource"> | Date | string
    updatedAt?: DateTimeFilter<"PluginSource"> | Date | string
  }, "id">

  export type PluginSourceOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    enabled?: SortOrder
    version?: SortOrderInput | SortOrder
    trustType?: SortOrder
    supportsHome?: SortOrder
    supportsSearch?: SortOrder
    supportsGenre?: SortOrder
    supportsPagination?: SortOrder
    supportsDetailDescription?: SortOrder
    supportsBrowserAutomation?: SortOrder
    timeoutMs?: SortOrder
    lastCheckedAt?: SortOrderInput | SortOrder
    lastError?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: PluginSourceCountOrderByAggregateInput
    _avg?: PluginSourceAvgOrderByAggregateInput
    _max?: PluginSourceMaxOrderByAggregateInput
    _min?: PluginSourceMinOrderByAggregateInput
    _sum?: PluginSourceSumOrderByAggregateInput
  }

  export type PluginSourceScalarWhereWithAggregatesInput = {
    AND?: PluginSourceScalarWhereWithAggregatesInput | PluginSourceScalarWhereWithAggregatesInput[]
    OR?: PluginSourceScalarWhereWithAggregatesInput[]
    NOT?: PluginSourceScalarWhereWithAggregatesInput | PluginSourceScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"PluginSource"> | string
    name?: StringWithAggregatesFilter<"PluginSource"> | string
    enabled?: BoolWithAggregatesFilter<"PluginSource"> | boolean
    version?: StringNullableWithAggregatesFilter<"PluginSource"> | string | null
    trustType?: StringWithAggregatesFilter<"PluginSource"> | string
    supportsHome?: BoolWithAggregatesFilter<"PluginSource"> | boolean
    supportsSearch?: BoolWithAggregatesFilter<"PluginSource"> | boolean
    supportsGenre?: BoolWithAggregatesFilter<"PluginSource"> | boolean
    supportsPagination?: BoolWithAggregatesFilter<"PluginSource"> | boolean
    supportsDetailDescription?: BoolWithAggregatesFilter<"PluginSource"> | boolean
    supportsBrowserAutomation?: BoolWithAggregatesFilter<"PluginSource"> | boolean
    timeoutMs?: IntWithAggregatesFilter<"PluginSource"> | number
    lastCheckedAt?: DateTimeNullableWithAggregatesFilter<"PluginSource"> | Date | string | null
    lastError?: StringNullableWithAggregatesFilter<"PluginSource"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"PluginSource"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"PluginSource"> | Date | string
  }

  export type AppSettingWhereInput = {
    AND?: AppSettingWhereInput | AppSettingWhereInput[]
    OR?: AppSettingWhereInput[]
    NOT?: AppSettingWhereInput | AppSettingWhereInput[]
    key?: StringFilter<"AppSetting"> | string
    value?: StringFilter<"AppSetting"> | string
    updatedAt?: DateTimeFilter<"AppSetting"> | Date | string
  }

  export type AppSettingOrderByWithRelationInput = {
    key?: SortOrder
    value?: SortOrder
    updatedAt?: SortOrder
  }

  export type AppSettingWhereUniqueInput = Prisma.AtLeast<{
    key?: string
    AND?: AppSettingWhereInput | AppSettingWhereInput[]
    OR?: AppSettingWhereInput[]
    NOT?: AppSettingWhereInput | AppSettingWhereInput[]
    value?: StringFilter<"AppSetting"> | string
    updatedAt?: DateTimeFilter<"AppSetting"> | Date | string
  }, "key">

  export type AppSettingOrderByWithAggregationInput = {
    key?: SortOrder
    value?: SortOrder
    updatedAt?: SortOrder
    _count?: AppSettingCountOrderByAggregateInput
    _max?: AppSettingMaxOrderByAggregateInput
    _min?: AppSettingMinOrderByAggregateInput
  }

  export type AppSettingScalarWhereWithAggregatesInput = {
    AND?: AppSettingScalarWhereWithAggregatesInput | AppSettingScalarWhereWithAggregatesInput[]
    OR?: AppSettingScalarWhereWithAggregatesInput[]
    NOT?: AppSettingScalarWhereWithAggregatesInput | AppSettingScalarWhereWithAggregatesInput[]
    key?: StringWithAggregatesFilter<"AppSetting"> | string
    value?: StringWithAggregatesFilter<"AppSetting"> | string
    updatedAt?: DateTimeWithAggregatesFilter<"AppSetting"> | Date | string
  }

  export type NovelCreateInput = {
    id?: string
    title: string
    author?: string | null
    sourceId: string
    sourceName?: string | null
    sourceUrl: string
    coverUrl?: string | null
    coverLocalPath?: string | null
    description?: string | null
    status?: string
    syncStatus?: string
    totalChapters?: number
    downloadedChapters?: number
    defaultEditionKind?: string
    defaultTranslationProjectId?: string | null
    lastCheckedAt?: Date | string | null
    lastSyncStartedAt?: Date | string | null
    lastSyncEndedAt?: Date | string | null
    lastError?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    chapters?: ChapterCreateNestedManyWithoutNovelInput
    syncRuns?: SyncRunCreateNestedManyWithoutNovelInput
    translationProjects?: TranslationProjectCreateNestedManyWithoutNovelInput
  }

  export type NovelUncheckedCreateInput = {
    id?: string
    title: string
    author?: string | null
    sourceId: string
    sourceName?: string | null
    sourceUrl: string
    coverUrl?: string | null
    coverLocalPath?: string | null
    description?: string | null
    status?: string
    syncStatus?: string
    totalChapters?: number
    downloadedChapters?: number
    defaultEditionKind?: string
    defaultTranslationProjectId?: string | null
    lastCheckedAt?: Date | string | null
    lastSyncStartedAt?: Date | string | null
    lastSyncEndedAt?: Date | string | null
    lastError?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    chapters?: ChapterUncheckedCreateNestedManyWithoutNovelInput
    syncRuns?: SyncRunUncheckedCreateNestedManyWithoutNovelInput
    translationProjects?: TranslationProjectUncheckedCreateNestedManyWithoutNovelInput
  }

  export type NovelUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    author?: NullableStringFieldUpdateOperationsInput | string | null
    sourceId?: StringFieldUpdateOperationsInput | string
    sourceName?: NullableStringFieldUpdateOperationsInput | string | null
    sourceUrl?: StringFieldUpdateOperationsInput | string
    coverUrl?: NullableStringFieldUpdateOperationsInput | string | null
    coverLocalPath?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    syncStatus?: StringFieldUpdateOperationsInput | string
    totalChapters?: IntFieldUpdateOperationsInput | number
    downloadedChapters?: IntFieldUpdateOperationsInput | number
    defaultEditionKind?: StringFieldUpdateOperationsInput | string
    defaultTranslationProjectId?: NullableStringFieldUpdateOperationsInput | string | null
    lastCheckedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastSyncStartedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastSyncEndedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    chapters?: ChapterUpdateManyWithoutNovelNestedInput
    syncRuns?: SyncRunUpdateManyWithoutNovelNestedInput
    translationProjects?: TranslationProjectUpdateManyWithoutNovelNestedInput
  }

  export type NovelUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    author?: NullableStringFieldUpdateOperationsInput | string | null
    sourceId?: StringFieldUpdateOperationsInput | string
    sourceName?: NullableStringFieldUpdateOperationsInput | string | null
    sourceUrl?: StringFieldUpdateOperationsInput | string
    coverUrl?: NullableStringFieldUpdateOperationsInput | string | null
    coverLocalPath?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    syncStatus?: StringFieldUpdateOperationsInput | string
    totalChapters?: IntFieldUpdateOperationsInput | number
    downloadedChapters?: IntFieldUpdateOperationsInput | number
    defaultEditionKind?: StringFieldUpdateOperationsInput | string
    defaultTranslationProjectId?: NullableStringFieldUpdateOperationsInput | string | null
    lastCheckedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastSyncStartedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastSyncEndedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    chapters?: ChapterUncheckedUpdateManyWithoutNovelNestedInput
    syncRuns?: SyncRunUncheckedUpdateManyWithoutNovelNestedInput
    translationProjects?: TranslationProjectUncheckedUpdateManyWithoutNovelNestedInput
  }

  export type NovelCreateManyInput = {
    id?: string
    title: string
    author?: string | null
    sourceId: string
    sourceName?: string | null
    sourceUrl: string
    coverUrl?: string | null
    coverLocalPath?: string | null
    description?: string | null
    status?: string
    syncStatus?: string
    totalChapters?: number
    downloadedChapters?: number
    defaultEditionKind?: string
    defaultTranslationProjectId?: string | null
    lastCheckedAt?: Date | string | null
    lastSyncStartedAt?: Date | string | null
    lastSyncEndedAt?: Date | string | null
    lastError?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type NovelUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    author?: NullableStringFieldUpdateOperationsInput | string | null
    sourceId?: StringFieldUpdateOperationsInput | string
    sourceName?: NullableStringFieldUpdateOperationsInput | string | null
    sourceUrl?: StringFieldUpdateOperationsInput | string
    coverUrl?: NullableStringFieldUpdateOperationsInput | string | null
    coverLocalPath?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    syncStatus?: StringFieldUpdateOperationsInput | string
    totalChapters?: IntFieldUpdateOperationsInput | number
    downloadedChapters?: IntFieldUpdateOperationsInput | number
    defaultEditionKind?: StringFieldUpdateOperationsInput | string
    defaultTranslationProjectId?: NullableStringFieldUpdateOperationsInput | string | null
    lastCheckedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastSyncStartedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastSyncEndedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type NovelUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    author?: NullableStringFieldUpdateOperationsInput | string | null
    sourceId?: StringFieldUpdateOperationsInput | string
    sourceName?: NullableStringFieldUpdateOperationsInput | string | null
    sourceUrl?: StringFieldUpdateOperationsInput | string
    coverUrl?: NullableStringFieldUpdateOperationsInput | string | null
    coverLocalPath?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    syncStatus?: StringFieldUpdateOperationsInput | string
    totalChapters?: IntFieldUpdateOperationsInput | number
    downloadedChapters?: IntFieldUpdateOperationsInput | number
    defaultEditionKind?: StringFieldUpdateOperationsInput | string
    defaultTranslationProjectId?: NullableStringFieldUpdateOperationsInput | string | null
    lastCheckedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastSyncStartedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastSyncEndedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChapterCreateInput = {
    id?: string
    chapterIndex: number
    title: string
    sourceUrl: string
    status?: string
    epubPath?: string | null
    fileSize?: number | null
    checksum?: string | null
    retryCount?: number
    publishedAt?: Date | string | null
    lastError?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    novel: NovelCreateNestedOneWithoutChaptersInput
    translations?: ChapterTranslationCreateNestedManyWithoutChapterInput
  }

  export type ChapterUncheckedCreateInput = {
    id?: string
    novelId: string
    chapterIndex: number
    title: string
    sourceUrl: string
    status?: string
    epubPath?: string | null
    fileSize?: number | null
    checksum?: string | null
    retryCount?: number
    publishedAt?: Date | string | null
    lastError?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    translations?: ChapterTranslationUncheckedCreateNestedManyWithoutChapterInput
  }

  export type ChapterUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    chapterIndex?: IntFieldUpdateOperationsInput | number
    title?: StringFieldUpdateOperationsInput | string
    sourceUrl?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    epubPath?: NullableStringFieldUpdateOperationsInput | string | null
    fileSize?: NullableIntFieldUpdateOperationsInput | number | null
    checksum?: NullableStringFieldUpdateOperationsInput | string | null
    retryCount?: IntFieldUpdateOperationsInput | number
    publishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    novel?: NovelUpdateOneRequiredWithoutChaptersNestedInput
    translations?: ChapterTranslationUpdateManyWithoutChapterNestedInput
  }

  export type ChapterUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    novelId?: StringFieldUpdateOperationsInput | string
    chapterIndex?: IntFieldUpdateOperationsInput | number
    title?: StringFieldUpdateOperationsInput | string
    sourceUrl?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    epubPath?: NullableStringFieldUpdateOperationsInput | string | null
    fileSize?: NullableIntFieldUpdateOperationsInput | number | null
    checksum?: NullableStringFieldUpdateOperationsInput | string | null
    retryCount?: IntFieldUpdateOperationsInput | number
    publishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    translations?: ChapterTranslationUncheckedUpdateManyWithoutChapterNestedInput
  }

  export type ChapterCreateManyInput = {
    id?: string
    novelId: string
    chapterIndex: number
    title: string
    sourceUrl: string
    status?: string
    epubPath?: string | null
    fileSize?: number | null
    checksum?: string | null
    retryCount?: number
    publishedAt?: Date | string | null
    lastError?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ChapterUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    chapterIndex?: IntFieldUpdateOperationsInput | number
    title?: StringFieldUpdateOperationsInput | string
    sourceUrl?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    epubPath?: NullableStringFieldUpdateOperationsInput | string | null
    fileSize?: NullableIntFieldUpdateOperationsInput | number | null
    checksum?: NullableStringFieldUpdateOperationsInput | string | null
    retryCount?: IntFieldUpdateOperationsInput | number
    publishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChapterUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    novelId?: StringFieldUpdateOperationsInput | string
    chapterIndex?: IntFieldUpdateOperationsInput | number
    title?: StringFieldUpdateOperationsInput | string
    sourceUrl?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    epubPath?: NullableStringFieldUpdateOperationsInput | string | null
    fileSize?: NullableIntFieldUpdateOperationsInput | number | null
    checksum?: NullableStringFieldUpdateOperationsInput | string | null
    retryCount?: IntFieldUpdateOperationsInput | number
    publishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SyncRunCreateInput = {
    id?: string
    triggerType: string
    status?: string
    totalFound?: number
    newChapters?: number
    errorMessage?: string | null
    startedAt?: Date | string | null
    endedAt?: Date | string | null
    createdAt?: Date | string
    novel: NovelCreateNestedOneWithoutSyncRunsInput
  }

  export type SyncRunUncheckedCreateInput = {
    id?: string
    novelId: string
    triggerType: string
    status?: string
    totalFound?: number
    newChapters?: number
    errorMessage?: string | null
    startedAt?: Date | string | null
    endedAt?: Date | string | null
    createdAt?: Date | string
  }

  export type SyncRunUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    triggerType?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    totalFound?: IntFieldUpdateOperationsInput | number
    newChapters?: IntFieldUpdateOperationsInput | number
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    novel?: NovelUpdateOneRequiredWithoutSyncRunsNestedInput
  }

  export type SyncRunUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    novelId?: StringFieldUpdateOperationsInput | string
    triggerType?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    totalFound?: IntFieldUpdateOperationsInput | number
    newChapters?: IntFieldUpdateOperationsInput | number
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SyncRunCreateManyInput = {
    id?: string
    novelId: string
    triggerType: string
    status?: string
    totalFound?: number
    newChapters?: number
    errorMessage?: string | null
    startedAt?: Date | string | null
    endedAt?: Date | string | null
    createdAt?: Date | string
  }

  export type SyncRunUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    triggerType?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    totalFound?: IntFieldUpdateOperationsInput | number
    newChapters?: IntFieldUpdateOperationsInput | number
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SyncRunUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    novelId?: StringFieldUpdateOperationsInput | string
    triggerType?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    totalFound?: IntFieldUpdateOperationsInput | number
    newChapters?: IntFieldUpdateOperationsInput | number
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TranslationProjectCreateInput = {
    id?: string
    name: string
    targetLanguage?: string
    provider?: string
    model?: string
    systemPrompt?: string | null
    styleGuideJson?: string
    contextMode?: string
    historyDepth?: number
    autoTranslateNewChapters?: boolean
    chapterConcurrency?: number
    isActiveAuto?: boolean
    isDefaultEdition?: boolean
    status?: string
    lastError?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    novel: NovelCreateNestedOneWithoutTranslationProjectsInput
    glossaries?: TranslationGlossaryCreateNestedManyWithoutProjectInput
    chapterTranslations?: ChapterTranslationCreateNestedManyWithoutProjectInput
    runs?: TranslationRunCreateNestedManyWithoutProjectInput
  }

  export type TranslationProjectUncheckedCreateInput = {
    id?: string
    novelId: string
    name: string
    targetLanguage?: string
    provider?: string
    model?: string
    systemPrompt?: string | null
    styleGuideJson?: string
    contextMode?: string
    historyDepth?: number
    autoTranslateNewChapters?: boolean
    chapterConcurrency?: number
    isActiveAuto?: boolean
    isDefaultEdition?: boolean
    status?: string
    lastError?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    glossaries?: TranslationGlossaryUncheckedCreateNestedManyWithoutProjectInput
    chapterTranslations?: ChapterTranslationUncheckedCreateNestedManyWithoutProjectInput
    runs?: TranslationRunUncheckedCreateNestedManyWithoutProjectInput
  }

  export type TranslationProjectUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    targetLanguage?: StringFieldUpdateOperationsInput | string
    provider?: StringFieldUpdateOperationsInput | string
    model?: StringFieldUpdateOperationsInput | string
    systemPrompt?: NullableStringFieldUpdateOperationsInput | string | null
    styleGuideJson?: StringFieldUpdateOperationsInput | string
    contextMode?: StringFieldUpdateOperationsInput | string
    historyDepth?: IntFieldUpdateOperationsInput | number
    autoTranslateNewChapters?: BoolFieldUpdateOperationsInput | boolean
    chapterConcurrency?: IntFieldUpdateOperationsInput | number
    isActiveAuto?: BoolFieldUpdateOperationsInput | boolean
    isDefaultEdition?: BoolFieldUpdateOperationsInput | boolean
    status?: StringFieldUpdateOperationsInput | string
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    novel?: NovelUpdateOneRequiredWithoutTranslationProjectsNestedInput
    glossaries?: TranslationGlossaryUpdateManyWithoutProjectNestedInput
    chapterTranslations?: ChapterTranslationUpdateManyWithoutProjectNestedInput
    runs?: TranslationRunUpdateManyWithoutProjectNestedInput
  }

  export type TranslationProjectUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    novelId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    targetLanguage?: StringFieldUpdateOperationsInput | string
    provider?: StringFieldUpdateOperationsInput | string
    model?: StringFieldUpdateOperationsInput | string
    systemPrompt?: NullableStringFieldUpdateOperationsInput | string | null
    styleGuideJson?: StringFieldUpdateOperationsInput | string
    contextMode?: StringFieldUpdateOperationsInput | string
    historyDepth?: IntFieldUpdateOperationsInput | number
    autoTranslateNewChapters?: BoolFieldUpdateOperationsInput | boolean
    chapterConcurrency?: IntFieldUpdateOperationsInput | number
    isActiveAuto?: BoolFieldUpdateOperationsInput | boolean
    isDefaultEdition?: BoolFieldUpdateOperationsInput | boolean
    status?: StringFieldUpdateOperationsInput | string
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    glossaries?: TranslationGlossaryUncheckedUpdateManyWithoutProjectNestedInput
    chapterTranslations?: ChapterTranslationUncheckedUpdateManyWithoutProjectNestedInput
    runs?: TranslationRunUncheckedUpdateManyWithoutProjectNestedInput
  }

  export type TranslationProjectCreateManyInput = {
    id?: string
    novelId: string
    name: string
    targetLanguage?: string
    provider?: string
    model?: string
    systemPrompt?: string | null
    styleGuideJson?: string
    contextMode?: string
    historyDepth?: number
    autoTranslateNewChapters?: boolean
    chapterConcurrency?: number
    isActiveAuto?: boolean
    isDefaultEdition?: boolean
    status?: string
    lastError?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TranslationProjectUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    targetLanguage?: StringFieldUpdateOperationsInput | string
    provider?: StringFieldUpdateOperationsInput | string
    model?: StringFieldUpdateOperationsInput | string
    systemPrompt?: NullableStringFieldUpdateOperationsInput | string | null
    styleGuideJson?: StringFieldUpdateOperationsInput | string
    contextMode?: StringFieldUpdateOperationsInput | string
    historyDepth?: IntFieldUpdateOperationsInput | number
    autoTranslateNewChapters?: BoolFieldUpdateOperationsInput | boolean
    chapterConcurrency?: IntFieldUpdateOperationsInput | number
    isActiveAuto?: BoolFieldUpdateOperationsInput | boolean
    isDefaultEdition?: BoolFieldUpdateOperationsInput | boolean
    status?: StringFieldUpdateOperationsInput | string
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TranslationProjectUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    novelId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    targetLanguage?: StringFieldUpdateOperationsInput | string
    provider?: StringFieldUpdateOperationsInput | string
    model?: StringFieldUpdateOperationsInput | string
    systemPrompt?: NullableStringFieldUpdateOperationsInput | string | null
    styleGuideJson?: StringFieldUpdateOperationsInput | string
    contextMode?: StringFieldUpdateOperationsInput | string
    historyDepth?: IntFieldUpdateOperationsInput | number
    autoTranslateNewChapters?: BoolFieldUpdateOperationsInput | boolean
    chapterConcurrency?: IntFieldUpdateOperationsInput | number
    isActiveAuto?: BoolFieldUpdateOperationsInput | boolean
    isDefaultEdition?: BoolFieldUpdateOperationsInput | boolean
    status?: StringFieldUpdateOperationsInput | string
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TranslationGlossaryCreateInput = {
    id?: string
    version: number
    sourceType?: string
    rawPayload?: string
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    project: TranslationProjectCreateNestedOneWithoutGlossariesInput
    entries?: TranslationGlossaryEntryCreateNestedManyWithoutGlossaryInput
  }

  export type TranslationGlossaryUncheckedCreateInput = {
    id?: string
    projectId: string
    version: number
    sourceType?: string
    rawPayload?: string
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    entries?: TranslationGlossaryEntryUncheckedCreateNestedManyWithoutGlossaryInput
  }

  export type TranslationGlossaryUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    version?: IntFieldUpdateOperationsInput | number
    sourceType?: StringFieldUpdateOperationsInput | string
    rawPayload?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    project?: TranslationProjectUpdateOneRequiredWithoutGlossariesNestedInput
    entries?: TranslationGlossaryEntryUpdateManyWithoutGlossaryNestedInput
  }

  export type TranslationGlossaryUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    projectId?: StringFieldUpdateOperationsInput | string
    version?: IntFieldUpdateOperationsInput | number
    sourceType?: StringFieldUpdateOperationsInput | string
    rawPayload?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    entries?: TranslationGlossaryEntryUncheckedUpdateManyWithoutGlossaryNestedInput
  }

  export type TranslationGlossaryCreateManyInput = {
    id?: string
    projectId: string
    version: number
    sourceType?: string
    rawPayload?: string
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TranslationGlossaryUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    version?: IntFieldUpdateOperationsInput | number
    sourceType?: StringFieldUpdateOperationsInput | string
    rawPayload?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TranslationGlossaryUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    projectId?: StringFieldUpdateOperationsInput | string
    version?: IntFieldUpdateOperationsInput | number
    sourceType?: StringFieldUpdateOperationsInput | string
    rawPayload?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TranslationGlossaryEntryCreateInput = {
    id?: string
    type?: string
    rawName: string
    translatedName: string
    viLabel?: string | null
    gender?: string | null
    description?: string | null
    aliasesJson?: string
    notes?: string | null
    locked?: boolean
    priority?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    glossary: TranslationGlossaryCreateNestedOneWithoutEntriesInput
  }

  export type TranslationGlossaryEntryUncheckedCreateInput = {
    id?: string
    glossaryId: string
    type?: string
    rawName: string
    translatedName: string
    viLabel?: string | null
    gender?: string | null
    description?: string | null
    aliasesJson?: string
    notes?: string | null
    locked?: boolean
    priority?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TranslationGlossaryEntryUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    rawName?: StringFieldUpdateOperationsInput | string
    translatedName?: StringFieldUpdateOperationsInput | string
    viLabel?: NullableStringFieldUpdateOperationsInput | string | null
    gender?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    aliasesJson?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    locked?: BoolFieldUpdateOperationsInput | boolean
    priority?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    glossary?: TranslationGlossaryUpdateOneRequiredWithoutEntriesNestedInput
  }

  export type TranslationGlossaryEntryUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    glossaryId?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    rawName?: StringFieldUpdateOperationsInput | string
    translatedName?: StringFieldUpdateOperationsInput | string
    viLabel?: NullableStringFieldUpdateOperationsInput | string | null
    gender?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    aliasesJson?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    locked?: BoolFieldUpdateOperationsInput | boolean
    priority?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TranslationGlossaryEntryCreateManyInput = {
    id?: string
    glossaryId: string
    type?: string
    rawName: string
    translatedName: string
    viLabel?: string | null
    gender?: string | null
    description?: string | null
    aliasesJson?: string
    notes?: string | null
    locked?: boolean
    priority?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TranslationGlossaryEntryUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    rawName?: StringFieldUpdateOperationsInput | string
    translatedName?: StringFieldUpdateOperationsInput | string
    viLabel?: NullableStringFieldUpdateOperationsInput | string | null
    gender?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    aliasesJson?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    locked?: BoolFieldUpdateOperationsInput | boolean
    priority?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TranslationGlossaryEntryUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    glossaryId?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    rawName?: StringFieldUpdateOperationsInput | string
    translatedName?: StringFieldUpdateOperationsInput | string
    viLabel?: NullableStringFieldUpdateOperationsInput | string | null
    gender?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    aliasesJson?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    locked?: BoolFieldUpdateOperationsInput | boolean
    priority?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChapterTranslationCreateInput = {
    id?: string
    sourceChecksum: string
    status?: string
    currentPublishedVersionId?: string | null
    latestGeneratedVersionId?: string | null
    hasManualEdits?: boolean
    newGeneratedAvailable?: boolean
    staleReason?: string | null
    lastError?: string | null
    retryCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    project: TranslationProjectCreateNestedOneWithoutChapterTranslationsInput
    chapter: ChapterCreateNestedOneWithoutTranslationsInput
    versions?: ChapterTranslationVersionCreateNestedManyWithoutChapterTranslationInput
  }

  export type ChapterTranslationUncheckedCreateInput = {
    id?: string
    projectId: string
    chapterId: string
    sourceChecksum: string
    status?: string
    currentPublishedVersionId?: string | null
    latestGeneratedVersionId?: string | null
    hasManualEdits?: boolean
    newGeneratedAvailable?: boolean
    staleReason?: string | null
    lastError?: string | null
    retryCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    versions?: ChapterTranslationVersionUncheckedCreateNestedManyWithoutChapterTranslationInput
  }

  export type ChapterTranslationUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    sourceChecksum?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    currentPublishedVersionId?: NullableStringFieldUpdateOperationsInput | string | null
    latestGeneratedVersionId?: NullableStringFieldUpdateOperationsInput | string | null
    hasManualEdits?: BoolFieldUpdateOperationsInput | boolean
    newGeneratedAvailable?: BoolFieldUpdateOperationsInput | boolean
    staleReason?: NullableStringFieldUpdateOperationsInput | string | null
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    retryCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    project?: TranslationProjectUpdateOneRequiredWithoutChapterTranslationsNestedInput
    chapter?: ChapterUpdateOneRequiredWithoutTranslationsNestedInput
    versions?: ChapterTranslationVersionUpdateManyWithoutChapterTranslationNestedInput
  }

  export type ChapterTranslationUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    projectId?: StringFieldUpdateOperationsInput | string
    chapterId?: StringFieldUpdateOperationsInput | string
    sourceChecksum?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    currentPublishedVersionId?: NullableStringFieldUpdateOperationsInput | string | null
    latestGeneratedVersionId?: NullableStringFieldUpdateOperationsInput | string | null
    hasManualEdits?: BoolFieldUpdateOperationsInput | boolean
    newGeneratedAvailable?: BoolFieldUpdateOperationsInput | boolean
    staleReason?: NullableStringFieldUpdateOperationsInput | string | null
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    retryCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    versions?: ChapterTranslationVersionUncheckedUpdateManyWithoutChapterTranslationNestedInput
  }

  export type ChapterTranslationCreateManyInput = {
    id?: string
    projectId: string
    chapterId: string
    sourceChecksum: string
    status?: string
    currentPublishedVersionId?: string | null
    latestGeneratedVersionId?: string | null
    hasManualEdits?: boolean
    newGeneratedAvailable?: boolean
    staleReason?: string | null
    lastError?: string | null
    retryCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ChapterTranslationUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    sourceChecksum?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    currentPublishedVersionId?: NullableStringFieldUpdateOperationsInput | string | null
    latestGeneratedVersionId?: NullableStringFieldUpdateOperationsInput | string | null
    hasManualEdits?: BoolFieldUpdateOperationsInput | boolean
    newGeneratedAvailable?: BoolFieldUpdateOperationsInput | boolean
    staleReason?: NullableStringFieldUpdateOperationsInput | string | null
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    retryCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChapterTranslationUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    projectId?: StringFieldUpdateOperationsInput | string
    chapterId?: StringFieldUpdateOperationsInput | string
    sourceChecksum?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    currentPublishedVersionId?: NullableStringFieldUpdateOperationsInput | string | null
    latestGeneratedVersionId?: NullableStringFieldUpdateOperationsInput | string | null
    hasManualEdits?: BoolFieldUpdateOperationsInput | boolean
    newGeneratedAvailable?: BoolFieldUpdateOperationsInput | boolean
    staleReason?: NullableStringFieldUpdateOperationsInput | string | null
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    retryCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChapterTranslationVersionCreateInput = {
    id?: string
    versionNumber: number
    kind: string
    title?: string | null
    htmlPath: string
    textPath?: string | null
    summary?: string | null
    provider?: string | null
    model?: string | null
    promptSnapshot?: string | null
    glossaryVersion?: number | null
    sourceChecksum: string
    isPublished?: boolean
    createdBy?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    chapterTranslation: ChapterTranslationCreateNestedOneWithoutVersionsInput
  }

  export type ChapterTranslationVersionUncheckedCreateInput = {
    id?: string
    chapterTranslationId: string
    versionNumber: number
    kind: string
    title?: string | null
    htmlPath: string
    textPath?: string | null
    summary?: string | null
    provider?: string | null
    model?: string | null
    promptSnapshot?: string | null
    glossaryVersion?: number | null
    sourceChecksum: string
    isPublished?: boolean
    createdBy?: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ChapterTranslationVersionUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    versionNumber?: IntFieldUpdateOperationsInput | number
    kind?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    htmlPath?: StringFieldUpdateOperationsInput | string
    textPath?: NullableStringFieldUpdateOperationsInput | string | null
    summary?: NullableStringFieldUpdateOperationsInput | string | null
    provider?: NullableStringFieldUpdateOperationsInput | string | null
    model?: NullableStringFieldUpdateOperationsInput | string | null
    promptSnapshot?: NullableStringFieldUpdateOperationsInput | string | null
    glossaryVersion?: NullableIntFieldUpdateOperationsInput | number | null
    sourceChecksum?: StringFieldUpdateOperationsInput | string
    isPublished?: BoolFieldUpdateOperationsInput | boolean
    createdBy?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    chapterTranslation?: ChapterTranslationUpdateOneRequiredWithoutVersionsNestedInput
  }

  export type ChapterTranslationVersionUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    chapterTranslationId?: StringFieldUpdateOperationsInput | string
    versionNumber?: IntFieldUpdateOperationsInput | number
    kind?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    htmlPath?: StringFieldUpdateOperationsInput | string
    textPath?: NullableStringFieldUpdateOperationsInput | string | null
    summary?: NullableStringFieldUpdateOperationsInput | string | null
    provider?: NullableStringFieldUpdateOperationsInput | string | null
    model?: NullableStringFieldUpdateOperationsInput | string | null
    promptSnapshot?: NullableStringFieldUpdateOperationsInput | string | null
    glossaryVersion?: NullableIntFieldUpdateOperationsInput | number | null
    sourceChecksum?: StringFieldUpdateOperationsInput | string
    isPublished?: BoolFieldUpdateOperationsInput | boolean
    createdBy?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChapterTranslationVersionCreateManyInput = {
    id?: string
    chapterTranslationId: string
    versionNumber: number
    kind: string
    title?: string | null
    htmlPath: string
    textPath?: string | null
    summary?: string | null
    provider?: string | null
    model?: string | null
    promptSnapshot?: string | null
    glossaryVersion?: number | null
    sourceChecksum: string
    isPublished?: boolean
    createdBy?: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ChapterTranslationVersionUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    versionNumber?: IntFieldUpdateOperationsInput | number
    kind?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    htmlPath?: StringFieldUpdateOperationsInput | string
    textPath?: NullableStringFieldUpdateOperationsInput | string | null
    summary?: NullableStringFieldUpdateOperationsInput | string | null
    provider?: NullableStringFieldUpdateOperationsInput | string | null
    model?: NullableStringFieldUpdateOperationsInput | string | null
    promptSnapshot?: NullableStringFieldUpdateOperationsInput | string | null
    glossaryVersion?: NullableIntFieldUpdateOperationsInput | number | null
    sourceChecksum?: StringFieldUpdateOperationsInput | string
    isPublished?: BoolFieldUpdateOperationsInput | boolean
    createdBy?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChapterTranslationVersionUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    chapterTranslationId?: StringFieldUpdateOperationsInput | string
    versionNumber?: IntFieldUpdateOperationsInput | number
    kind?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    htmlPath?: StringFieldUpdateOperationsInput | string
    textPath?: NullableStringFieldUpdateOperationsInput | string | null
    summary?: NullableStringFieldUpdateOperationsInput | string | null
    provider?: NullableStringFieldUpdateOperationsInput | string | null
    model?: NullableStringFieldUpdateOperationsInput | string | null
    promptSnapshot?: NullableStringFieldUpdateOperationsInput | string | null
    glossaryVersion?: NullableIntFieldUpdateOperationsInput | number | null
    sourceChecksum?: StringFieldUpdateOperationsInput | string
    isPublished?: BoolFieldUpdateOperationsInput | boolean
    createdBy?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TranslationRunCreateInput = {
    id?: string
    triggerType: string
    scope?: string
    status?: string
    queuedCount?: number
    completedCount?: number
    failedCount?: number
    tokenUsage?: number
    estimatedCost?: number
    errorMessage?: string | null
    startedAt?: Date | string | null
    endedAt?: Date | string | null
    createdAt?: Date | string
    project: TranslationProjectCreateNestedOneWithoutRunsInput
  }

  export type TranslationRunUncheckedCreateInput = {
    id?: string
    projectId: string
    triggerType: string
    scope?: string
    status?: string
    queuedCount?: number
    completedCount?: number
    failedCount?: number
    tokenUsage?: number
    estimatedCost?: number
    errorMessage?: string | null
    startedAt?: Date | string | null
    endedAt?: Date | string | null
    createdAt?: Date | string
  }

  export type TranslationRunUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    triggerType?: StringFieldUpdateOperationsInput | string
    scope?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    queuedCount?: IntFieldUpdateOperationsInput | number
    completedCount?: IntFieldUpdateOperationsInput | number
    failedCount?: IntFieldUpdateOperationsInput | number
    tokenUsage?: IntFieldUpdateOperationsInput | number
    estimatedCost?: FloatFieldUpdateOperationsInput | number
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    project?: TranslationProjectUpdateOneRequiredWithoutRunsNestedInput
  }

  export type TranslationRunUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    projectId?: StringFieldUpdateOperationsInput | string
    triggerType?: StringFieldUpdateOperationsInput | string
    scope?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    queuedCount?: IntFieldUpdateOperationsInput | number
    completedCount?: IntFieldUpdateOperationsInput | number
    failedCount?: IntFieldUpdateOperationsInput | number
    tokenUsage?: IntFieldUpdateOperationsInput | number
    estimatedCost?: FloatFieldUpdateOperationsInput | number
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TranslationRunCreateManyInput = {
    id?: string
    projectId: string
    triggerType: string
    scope?: string
    status?: string
    queuedCount?: number
    completedCount?: number
    failedCount?: number
    tokenUsage?: number
    estimatedCost?: number
    errorMessage?: string | null
    startedAt?: Date | string | null
    endedAt?: Date | string | null
    createdAt?: Date | string
  }

  export type TranslationRunUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    triggerType?: StringFieldUpdateOperationsInput | string
    scope?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    queuedCount?: IntFieldUpdateOperationsInput | number
    completedCount?: IntFieldUpdateOperationsInput | number
    failedCount?: IntFieldUpdateOperationsInput | number
    tokenUsage?: IntFieldUpdateOperationsInput | number
    estimatedCost?: FloatFieldUpdateOperationsInput | number
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TranslationRunUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    projectId?: StringFieldUpdateOperationsInput | string
    triggerType?: StringFieldUpdateOperationsInput | string
    scope?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    queuedCount?: IntFieldUpdateOperationsInput | number
    completedCount?: IntFieldUpdateOperationsInput | number
    failedCount?: IntFieldUpdateOperationsInput | number
    tokenUsage?: IntFieldUpdateOperationsInput | number
    estimatedCost?: FloatFieldUpdateOperationsInput | number
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PluginSourceCreateInput = {
    id: string
    name: string
    enabled?: boolean
    version?: string | null
    trustType?: string
    supportsHome?: boolean
    supportsSearch?: boolean
    supportsGenre?: boolean
    supportsPagination?: boolean
    supportsDetailDescription?: boolean
    supportsBrowserAutomation?: boolean
    timeoutMs?: number
    lastCheckedAt?: Date | string | null
    lastError?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PluginSourceUncheckedCreateInput = {
    id: string
    name: string
    enabled?: boolean
    version?: string | null
    trustType?: string
    supportsHome?: boolean
    supportsSearch?: boolean
    supportsGenre?: boolean
    supportsPagination?: boolean
    supportsDetailDescription?: boolean
    supportsBrowserAutomation?: boolean
    timeoutMs?: number
    lastCheckedAt?: Date | string | null
    lastError?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PluginSourceUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    enabled?: BoolFieldUpdateOperationsInput | boolean
    version?: NullableStringFieldUpdateOperationsInput | string | null
    trustType?: StringFieldUpdateOperationsInput | string
    supportsHome?: BoolFieldUpdateOperationsInput | boolean
    supportsSearch?: BoolFieldUpdateOperationsInput | boolean
    supportsGenre?: BoolFieldUpdateOperationsInput | boolean
    supportsPagination?: BoolFieldUpdateOperationsInput | boolean
    supportsDetailDescription?: BoolFieldUpdateOperationsInput | boolean
    supportsBrowserAutomation?: BoolFieldUpdateOperationsInput | boolean
    timeoutMs?: IntFieldUpdateOperationsInput | number
    lastCheckedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PluginSourceUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    enabled?: BoolFieldUpdateOperationsInput | boolean
    version?: NullableStringFieldUpdateOperationsInput | string | null
    trustType?: StringFieldUpdateOperationsInput | string
    supportsHome?: BoolFieldUpdateOperationsInput | boolean
    supportsSearch?: BoolFieldUpdateOperationsInput | boolean
    supportsGenre?: BoolFieldUpdateOperationsInput | boolean
    supportsPagination?: BoolFieldUpdateOperationsInput | boolean
    supportsDetailDescription?: BoolFieldUpdateOperationsInput | boolean
    supportsBrowserAutomation?: BoolFieldUpdateOperationsInput | boolean
    timeoutMs?: IntFieldUpdateOperationsInput | number
    lastCheckedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PluginSourceCreateManyInput = {
    id: string
    name: string
    enabled?: boolean
    version?: string | null
    trustType?: string
    supportsHome?: boolean
    supportsSearch?: boolean
    supportsGenre?: boolean
    supportsPagination?: boolean
    supportsDetailDescription?: boolean
    supportsBrowserAutomation?: boolean
    timeoutMs?: number
    lastCheckedAt?: Date | string | null
    lastError?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PluginSourceUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    enabled?: BoolFieldUpdateOperationsInput | boolean
    version?: NullableStringFieldUpdateOperationsInput | string | null
    trustType?: StringFieldUpdateOperationsInput | string
    supportsHome?: BoolFieldUpdateOperationsInput | boolean
    supportsSearch?: BoolFieldUpdateOperationsInput | boolean
    supportsGenre?: BoolFieldUpdateOperationsInput | boolean
    supportsPagination?: BoolFieldUpdateOperationsInput | boolean
    supportsDetailDescription?: BoolFieldUpdateOperationsInput | boolean
    supportsBrowserAutomation?: BoolFieldUpdateOperationsInput | boolean
    timeoutMs?: IntFieldUpdateOperationsInput | number
    lastCheckedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PluginSourceUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    enabled?: BoolFieldUpdateOperationsInput | boolean
    version?: NullableStringFieldUpdateOperationsInput | string | null
    trustType?: StringFieldUpdateOperationsInput | string
    supportsHome?: BoolFieldUpdateOperationsInput | boolean
    supportsSearch?: BoolFieldUpdateOperationsInput | boolean
    supportsGenre?: BoolFieldUpdateOperationsInput | boolean
    supportsPagination?: BoolFieldUpdateOperationsInput | boolean
    supportsDetailDescription?: BoolFieldUpdateOperationsInput | boolean
    supportsBrowserAutomation?: BoolFieldUpdateOperationsInput | boolean
    timeoutMs?: IntFieldUpdateOperationsInput | number
    lastCheckedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AppSettingCreateInput = {
    key: string
    value: string
    updatedAt?: Date | string
  }

  export type AppSettingUncheckedCreateInput = {
    key: string
    value: string
    updatedAt?: Date | string
  }

  export type AppSettingUpdateInput = {
    key?: StringFieldUpdateOperationsInput | string
    value?: StringFieldUpdateOperationsInput | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AppSettingUncheckedUpdateInput = {
    key?: StringFieldUpdateOperationsInput | string
    value?: StringFieldUpdateOperationsInput | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AppSettingCreateManyInput = {
    key: string
    value: string
    updatedAt?: Date | string
  }

  export type AppSettingUpdateManyMutationInput = {
    key?: StringFieldUpdateOperationsInput | string
    value?: StringFieldUpdateOperationsInput | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AppSettingUncheckedUpdateManyInput = {
    key?: StringFieldUpdateOperationsInput | string
    value?: StringFieldUpdateOperationsInput | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type ChapterListRelationFilter = {
    every?: ChapterWhereInput
    some?: ChapterWhereInput
    none?: ChapterWhereInput
  }

  export type SyncRunListRelationFilter = {
    every?: SyncRunWhereInput
    some?: SyncRunWhereInput
    none?: SyncRunWhereInput
  }

  export type TranslationProjectListRelationFilter = {
    every?: TranslationProjectWhereInput
    some?: TranslationProjectWhereInput
    none?: TranslationProjectWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type ChapterOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type SyncRunOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type TranslationProjectOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type NovelCountOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    author?: SortOrder
    sourceId?: SortOrder
    sourceName?: SortOrder
    sourceUrl?: SortOrder
    coverUrl?: SortOrder
    coverLocalPath?: SortOrder
    description?: SortOrder
    status?: SortOrder
    syncStatus?: SortOrder
    totalChapters?: SortOrder
    downloadedChapters?: SortOrder
    defaultEditionKind?: SortOrder
    defaultTranslationProjectId?: SortOrder
    lastCheckedAt?: SortOrder
    lastSyncStartedAt?: SortOrder
    lastSyncEndedAt?: SortOrder
    lastError?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type NovelAvgOrderByAggregateInput = {
    totalChapters?: SortOrder
    downloadedChapters?: SortOrder
  }

  export type NovelMaxOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    author?: SortOrder
    sourceId?: SortOrder
    sourceName?: SortOrder
    sourceUrl?: SortOrder
    coverUrl?: SortOrder
    coverLocalPath?: SortOrder
    description?: SortOrder
    status?: SortOrder
    syncStatus?: SortOrder
    totalChapters?: SortOrder
    downloadedChapters?: SortOrder
    defaultEditionKind?: SortOrder
    defaultTranslationProjectId?: SortOrder
    lastCheckedAt?: SortOrder
    lastSyncStartedAt?: SortOrder
    lastSyncEndedAt?: SortOrder
    lastError?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type NovelMinOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    author?: SortOrder
    sourceId?: SortOrder
    sourceName?: SortOrder
    sourceUrl?: SortOrder
    coverUrl?: SortOrder
    coverLocalPath?: SortOrder
    description?: SortOrder
    status?: SortOrder
    syncStatus?: SortOrder
    totalChapters?: SortOrder
    downloadedChapters?: SortOrder
    defaultEditionKind?: SortOrder
    defaultTranslationProjectId?: SortOrder
    lastCheckedAt?: SortOrder
    lastSyncStartedAt?: SortOrder
    lastSyncEndedAt?: SortOrder
    lastError?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type NovelSumOrderByAggregateInput = {
    totalChapters?: SortOrder
    downloadedChapters?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type IntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NovelScalarRelationFilter = {
    is?: NovelWhereInput
    isNot?: NovelWhereInput
  }

  export type ChapterTranslationListRelationFilter = {
    every?: ChapterTranslationWhereInput
    some?: ChapterTranslationWhereInput
    none?: ChapterTranslationWhereInput
  }

  export type ChapterTranslationOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ChapterNovelIdChapterIndexCompoundUniqueInput = {
    novelId: string
    chapterIndex: number
  }

  export type ChapterCountOrderByAggregateInput = {
    id?: SortOrder
    novelId?: SortOrder
    chapterIndex?: SortOrder
    title?: SortOrder
    sourceUrl?: SortOrder
    status?: SortOrder
    epubPath?: SortOrder
    fileSize?: SortOrder
    checksum?: SortOrder
    retryCount?: SortOrder
    publishedAt?: SortOrder
    lastError?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ChapterAvgOrderByAggregateInput = {
    chapterIndex?: SortOrder
    fileSize?: SortOrder
    retryCount?: SortOrder
  }

  export type ChapterMaxOrderByAggregateInput = {
    id?: SortOrder
    novelId?: SortOrder
    chapterIndex?: SortOrder
    title?: SortOrder
    sourceUrl?: SortOrder
    status?: SortOrder
    epubPath?: SortOrder
    fileSize?: SortOrder
    checksum?: SortOrder
    retryCount?: SortOrder
    publishedAt?: SortOrder
    lastError?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ChapterMinOrderByAggregateInput = {
    id?: SortOrder
    novelId?: SortOrder
    chapterIndex?: SortOrder
    title?: SortOrder
    sourceUrl?: SortOrder
    status?: SortOrder
    epubPath?: SortOrder
    fileSize?: SortOrder
    checksum?: SortOrder
    retryCount?: SortOrder
    publishedAt?: SortOrder
    lastError?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ChapterSumOrderByAggregateInput = {
    chapterIndex?: SortOrder
    fileSize?: SortOrder
    retryCount?: SortOrder
  }

  export type IntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type SyncRunCountOrderByAggregateInput = {
    id?: SortOrder
    novelId?: SortOrder
    triggerType?: SortOrder
    status?: SortOrder
    totalFound?: SortOrder
    newChapters?: SortOrder
    errorMessage?: SortOrder
    startedAt?: SortOrder
    endedAt?: SortOrder
    createdAt?: SortOrder
  }

  export type SyncRunAvgOrderByAggregateInput = {
    totalFound?: SortOrder
    newChapters?: SortOrder
  }

  export type SyncRunMaxOrderByAggregateInput = {
    id?: SortOrder
    novelId?: SortOrder
    triggerType?: SortOrder
    status?: SortOrder
    totalFound?: SortOrder
    newChapters?: SortOrder
    errorMessage?: SortOrder
    startedAt?: SortOrder
    endedAt?: SortOrder
    createdAt?: SortOrder
  }

  export type SyncRunMinOrderByAggregateInput = {
    id?: SortOrder
    novelId?: SortOrder
    triggerType?: SortOrder
    status?: SortOrder
    totalFound?: SortOrder
    newChapters?: SortOrder
    errorMessage?: SortOrder
    startedAt?: SortOrder
    endedAt?: SortOrder
    createdAt?: SortOrder
  }

  export type SyncRunSumOrderByAggregateInput = {
    totalFound?: SortOrder
    newChapters?: SortOrder
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type TranslationGlossaryListRelationFilter = {
    every?: TranslationGlossaryWhereInput
    some?: TranslationGlossaryWhereInput
    none?: TranslationGlossaryWhereInput
  }

  export type TranslationRunListRelationFilter = {
    every?: TranslationRunWhereInput
    some?: TranslationRunWhereInput
    none?: TranslationRunWhereInput
  }

  export type TranslationGlossaryOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type TranslationRunOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type TranslationProjectCountOrderByAggregateInput = {
    id?: SortOrder
    novelId?: SortOrder
    name?: SortOrder
    targetLanguage?: SortOrder
    provider?: SortOrder
    model?: SortOrder
    systemPrompt?: SortOrder
    styleGuideJson?: SortOrder
    contextMode?: SortOrder
    historyDepth?: SortOrder
    autoTranslateNewChapters?: SortOrder
    chapterConcurrency?: SortOrder
    isActiveAuto?: SortOrder
    isDefaultEdition?: SortOrder
    status?: SortOrder
    lastError?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TranslationProjectAvgOrderByAggregateInput = {
    historyDepth?: SortOrder
    chapterConcurrency?: SortOrder
  }

  export type TranslationProjectMaxOrderByAggregateInput = {
    id?: SortOrder
    novelId?: SortOrder
    name?: SortOrder
    targetLanguage?: SortOrder
    provider?: SortOrder
    model?: SortOrder
    systemPrompt?: SortOrder
    styleGuideJson?: SortOrder
    contextMode?: SortOrder
    historyDepth?: SortOrder
    autoTranslateNewChapters?: SortOrder
    chapterConcurrency?: SortOrder
    isActiveAuto?: SortOrder
    isDefaultEdition?: SortOrder
    status?: SortOrder
    lastError?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TranslationProjectMinOrderByAggregateInput = {
    id?: SortOrder
    novelId?: SortOrder
    name?: SortOrder
    targetLanguage?: SortOrder
    provider?: SortOrder
    model?: SortOrder
    systemPrompt?: SortOrder
    styleGuideJson?: SortOrder
    contextMode?: SortOrder
    historyDepth?: SortOrder
    autoTranslateNewChapters?: SortOrder
    chapterConcurrency?: SortOrder
    isActiveAuto?: SortOrder
    isDefaultEdition?: SortOrder
    status?: SortOrder
    lastError?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TranslationProjectSumOrderByAggregateInput = {
    historyDepth?: SortOrder
    chapterConcurrency?: SortOrder
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type TranslationProjectScalarRelationFilter = {
    is?: TranslationProjectWhereInput
    isNot?: TranslationProjectWhereInput
  }

  export type TranslationGlossaryEntryListRelationFilter = {
    every?: TranslationGlossaryEntryWhereInput
    some?: TranslationGlossaryEntryWhereInput
    none?: TranslationGlossaryEntryWhereInput
  }

  export type TranslationGlossaryEntryOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type TranslationGlossaryProjectIdVersionCompoundUniqueInput = {
    projectId: string
    version: number
  }

  export type TranslationGlossaryCountOrderByAggregateInput = {
    id?: SortOrder
    projectId?: SortOrder
    version?: SortOrder
    sourceType?: SortOrder
    rawPayload?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TranslationGlossaryAvgOrderByAggregateInput = {
    version?: SortOrder
  }

  export type TranslationGlossaryMaxOrderByAggregateInput = {
    id?: SortOrder
    projectId?: SortOrder
    version?: SortOrder
    sourceType?: SortOrder
    rawPayload?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TranslationGlossaryMinOrderByAggregateInput = {
    id?: SortOrder
    projectId?: SortOrder
    version?: SortOrder
    sourceType?: SortOrder
    rawPayload?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TranslationGlossarySumOrderByAggregateInput = {
    version?: SortOrder
  }

  export type TranslationGlossaryScalarRelationFilter = {
    is?: TranslationGlossaryWhereInput
    isNot?: TranslationGlossaryWhereInput
  }

  export type TranslationGlossaryEntryCountOrderByAggregateInput = {
    id?: SortOrder
    glossaryId?: SortOrder
    type?: SortOrder
    rawName?: SortOrder
    translatedName?: SortOrder
    viLabel?: SortOrder
    gender?: SortOrder
    description?: SortOrder
    aliasesJson?: SortOrder
    notes?: SortOrder
    locked?: SortOrder
    priority?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TranslationGlossaryEntryAvgOrderByAggregateInput = {
    priority?: SortOrder
  }

  export type TranslationGlossaryEntryMaxOrderByAggregateInput = {
    id?: SortOrder
    glossaryId?: SortOrder
    type?: SortOrder
    rawName?: SortOrder
    translatedName?: SortOrder
    viLabel?: SortOrder
    gender?: SortOrder
    description?: SortOrder
    aliasesJson?: SortOrder
    notes?: SortOrder
    locked?: SortOrder
    priority?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TranslationGlossaryEntryMinOrderByAggregateInput = {
    id?: SortOrder
    glossaryId?: SortOrder
    type?: SortOrder
    rawName?: SortOrder
    translatedName?: SortOrder
    viLabel?: SortOrder
    gender?: SortOrder
    description?: SortOrder
    aliasesJson?: SortOrder
    notes?: SortOrder
    locked?: SortOrder
    priority?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TranslationGlossaryEntrySumOrderByAggregateInput = {
    priority?: SortOrder
  }

  export type ChapterScalarRelationFilter = {
    is?: ChapterWhereInput
    isNot?: ChapterWhereInput
  }

  export type ChapterTranslationVersionListRelationFilter = {
    every?: ChapterTranslationVersionWhereInput
    some?: ChapterTranslationVersionWhereInput
    none?: ChapterTranslationVersionWhereInput
  }

  export type ChapterTranslationVersionOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ChapterTranslationProjectIdChapterIdCompoundUniqueInput = {
    projectId: string
    chapterId: string
  }

  export type ChapterTranslationCountOrderByAggregateInput = {
    id?: SortOrder
    projectId?: SortOrder
    chapterId?: SortOrder
    sourceChecksum?: SortOrder
    status?: SortOrder
    currentPublishedVersionId?: SortOrder
    latestGeneratedVersionId?: SortOrder
    hasManualEdits?: SortOrder
    newGeneratedAvailable?: SortOrder
    staleReason?: SortOrder
    lastError?: SortOrder
    retryCount?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ChapterTranslationAvgOrderByAggregateInput = {
    retryCount?: SortOrder
  }

  export type ChapterTranslationMaxOrderByAggregateInput = {
    id?: SortOrder
    projectId?: SortOrder
    chapterId?: SortOrder
    sourceChecksum?: SortOrder
    status?: SortOrder
    currentPublishedVersionId?: SortOrder
    latestGeneratedVersionId?: SortOrder
    hasManualEdits?: SortOrder
    newGeneratedAvailable?: SortOrder
    staleReason?: SortOrder
    lastError?: SortOrder
    retryCount?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ChapterTranslationMinOrderByAggregateInput = {
    id?: SortOrder
    projectId?: SortOrder
    chapterId?: SortOrder
    sourceChecksum?: SortOrder
    status?: SortOrder
    currentPublishedVersionId?: SortOrder
    latestGeneratedVersionId?: SortOrder
    hasManualEdits?: SortOrder
    newGeneratedAvailable?: SortOrder
    staleReason?: SortOrder
    lastError?: SortOrder
    retryCount?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ChapterTranslationSumOrderByAggregateInput = {
    retryCount?: SortOrder
  }

  export type ChapterTranslationScalarRelationFilter = {
    is?: ChapterTranslationWhereInput
    isNot?: ChapterTranslationWhereInput
  }

  export type ChapterTranslationVersionChapterTranslationIdVersionNumberCompoundUniqueInput = {
    chapterTranslationId: string
    versionNumber: number
  }

  export type ChapterTranslationVersionCountOrderByAggregateInput = {
    id?: SortOrder
    chapterTranslationId?: SortOrder
    versionNumber?: SortOrder
    kind?: SortOrder
    title?: SortOrder
    htmlPath?: SortOrder
    textPath?: SortOrder
    summary?: SortOrder
    provider?: SortOrder
    model?: SortOrder
    promptSnapshot?: SortOrder
    glossaryVersion?: SortOrder
    sourceChecksum?: SortOrder
    isPublished?: SortOrder
    createdBy?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ChapterTranslationVersionAvgOrderByAggregateInput = {
    versionNumber?: SortOrder
    glossaryVersion?: SortOrder
  }

  export type ChapterTranslationVersionMaxOrderByAggregateInput = {
    id?: SortOrder
    chapterTranslationId?: SortOrder
    versionNumber?: SortOrder
    kind?: SortOrder
    title?: SortOrder
    htmlPath?: SortOrder
    textPath?: SortOrder
    summary?: SortOrder
    provider?: SortOrder
    model?: SortOrder
    promptSnapshot?: SortOrder
    glossaryVersion?: SortOrder
    sourceChecksum?: SortOrder
    isPublished?: SortOrder
    createdBy?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ChapterTranslationVersionMinOrderByAggregateInput = {
    id?: SortOrder
    chapterTranslationId?: SortOrder
    versionNumber?: SortOrder
    kind?: SortOrder
    title?: SortOrder
    htmlPath?: SortOrder
    textPath?: SortOrder
    summary?: SortOrder
    provider?: SortOrder
    model?: SortOrder
    promptSnapshot?: SortOrder
    glossaryVersion?: SortOrder
    sourceChecksum?: SortOrder
    isPublished?: SortOrder
    createdBy?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ChapterTranslationVersionSumOrderByAggregateInput = {
    versionNumber?: SortOrder
    glossaryVersion?: SortOrder
  }

  export type FloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type TranslationRunCountOrderByAggregateInput = {
    id?: SortOrder
    projectId?: SortOrder
    triggerType?: SortOrder
    scope?: SortOrder
    status?: SortOrder
    queuedCount?: SortOrder
    completedCount?: SortOrder
    failedCount?: SortOrder
    tokenUsage?: SortOrder
    estimatedCost?: SortOrder
    errorMessage?: SortOrder
    startedAt?: SortOrder
    endedAt?: SortOrder
    createdAt?: SortOrder
  }

  export type TranslationRunAvgOrderByAggregateInput = {
    queuedCount?: SortOrder
    completedCount?: SortOrder
    failedCount?: SortOrder
    tokenUsage?: SortOrder
    estimatedCost?: SortOrder
  }

  export type TranslationRunMaxOrderByAggregateInput = {
    id?: SortOrder
    projectId?: SortOrder
    triggerType?: SortOrder
    scope?: SortOrder
    status?: SortOrder
    queuedCount?: SortOrder
    completedCount?: SortOrder
    failedCount?: SortOrder
    tokenUsage?: SortOrder
    estimatedCost?: SortOrder
    errorMessage?: SortOrder
    startedAt?: SortOrder
    endedAt?: SortOrder
    createdAt?: SortOrder
  }

  export type TranslationRunMinOrderByAggregateInput = {
    id?: SortOrder
    projectId?: SortOrder
    triggerType?: SortOrder
    scope?: SortOrder
    status?: SortOrder
    queuedCount?: SortOrder
    completedCount?: SortOrder
    failedCount?: SortOrder
    tokenUsage?: SortOrder
    estimatedCost?: SortOrder
    errorMessage?: SortOrder
    startedAt?: SortOrder
    endedAt?: SortOrder
    createdAt?: SortOrder
  }

  export type TranslationRunSumOrderByAggregateInput = {
    queuedCount?: SortOrder
    completedCount?: SortOrder
    failedCount?: SortOrder
    tokenUsage?: SortOrder
    estimatedCost?: SortOrder
  }

  export type FloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedFloatFilter<$PrismaModel>
    _min?: NestedFloatFilter<$PrismaModel>
    _max?: NestedFloatFilter<$PrismaModel>
  }

  export type PluginSourceCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    enabled?: SortOrder
    version?: SortOrder
    trustType?: SortOrder
    supportsHome?: SortOrder
    supportsSearch?: SortOrder
    supportsGenre?: SortOrder
    supportsPagination?: SortOrder
    supportsDetailDescription?: SortOrder
    supportsBrowserAutomation?: SortOrder
    timeoutMs?: SortOrder
    lastCheckedAt?: SortOrder
    lastError?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PluginSourceAvgOrderByAggregateInput = {
    timeoutMs?: SortOrder
  }

  export type PluginSourceMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    enabled?: SortOrder
    version?: SortOrder
    trustType?: SortOrder
    supportsHome?: SortOrder
    supportsSearch?: SortOrder
    supportsGenre?: SortOrder
    supportsPagination?: SortOrder
    supportsDetailDescription?: SortOrder
    supportsBrowserAutomation?: SortOrder
    timeoutMs?: SortOrder
    lastCheckedAt?: SortOrder
    lastError?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PluginSourceMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    enabled?: SortOrder
    version?: SortOrder
    trustType?: SortOrder
    supportsHome?: SortOrder
    supportsSearch?: SortOrder
    supportsGenre?: SortOrder
    supportsPagination?: SortOrder
    supportsDetailDescription?: SortOrder
    supportsBrowserAutomation?: SortOrder
    timeoutMs?: SortOrder
    lastCheckedAt?: SortOrder
    lastError?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PluginSourceSumOrderByAggregateInput = {
    timeoutMs?: SortOrder
  }

  export type AppSettingCountOrderByAggregateInput = {
    key?: SortOrder
    value?: SortOrder
    updatedAt?: SortOrder
  }

  export type AppSettingMaxOrderByAggregateInput = {
    key?: SortOrder
    value?: SortOrder
    updatedAt?: SortOrder
  }

  export type AppSettingMinOrderByAggregateInput = {
    key?: SortOrder
    value?: SortOrder
    updatedAt?: SortOrder
  }

  export type ChapterCreateNestedManyWithoutNovelInput = {
    create?: XOR<ChapterCreateWithoutNovelInput, ChapterUncheckedCreateWithoutNovelInput> | ChapterCreateWithoutNovelInput[] | ChapterUncheckedCreateWithoutNovelInput[]
    connectOrCreate?: ChapterCreateOrConnectWithoutNovelInput | ChapterCreateOrConnectWithoutNovelInput[]
    createMany?: ChapterCreateManyNovelInputEnvelope
    connect?: ChapterWhereUniqueInput | ChapterWhereUniqueInput[]
  }

  export type SyncRunCreateNestedManyWithoutNovelInput = {
    create?: XOR<SyncRunCreateWithoutNovelInput, SyncRunUncheckedCreateWithoutNovelInput> | SyncRunCreateWithoutNovelInput[] | SyncRunUncheckedCreateWithoutNovelInput[]
    connectOrCreate?: SyncRunCreateOrConnectWithoutNovelInput | SyncRunCreateOrConnectWithoutNovelInput[]
    createMany?: SyncRunCreateManyNovelInputEnvelope
    connect?: SyncRunWhereUniqueInput | SyncRunWhereUniqueInput[]
  }

  export type TranslationProjectCreateNestedManyWithoutNovelInput = {
    create?: XOR<TranslationProjectCreateWithoutNovelInput, TranslationProjectUncheckedCreateWithoutNovelInput> | TranslationProjectCreateWithoutNovelInput[] | TranslationProjectUncheckedCreateWithoutNovelInput[]
    connectOrCreate?: TranslationProjectCreateOrConnectWithoutNovelInput | TranslationProjectCreateOrConnectWithoutNovelInput[]
    createMany?: TranslationProjectCreateManyNovelInputEnvelope
    connect?: TranslationProjectWhereUniqueInput | TranslationProjectWhereUniqueInput[]
  }

  export type ChapterUncheckedCreateNestedManyWithoutNovelInput = {
    create?: XOR<ChapterCreateWithoutNovelInput, ChapterUncheckedCreateWithoutNovelInput> | ChapterCreateWithoutNovelInput[] | ChapterUncheckedCreateWithoutNovelInput[]
    connectOrCreate?: ChapterCreateOrConnectWithoutNovelInput | ChapterCreateOrConnectWithoutNovelInput[]
    createMany?: ChapterCreateManyNovelInputEnvelope
    connect?: ChapterWhereUniqueInput | ChapterWhereUniqueInput[]
  }

  export type SyncRunUncheckedCreateNestedManyWithoutNovelInput = {
    create?: XOR<SyncRunCreateWithoutNovelInput, SyncRunUncheckedCreateWithoutNovelInput> | SyncRunCreateWithoutNovelInput[] | SyncRunUncheckedCreateWithoutNovelInput[]
    connectOrCreate?: SyncRunCreateOrConnectWithoutNovelInput | SyncRunCreateOrConnectWithoutNovelInput[]
    createMany?: SyncRunCreateManyNovelInputEnvelope
    connect?: SyncRunWhereUniqueInput | SyncRunWhereUniqueInput[]
  }

  export type TranslationProjectUncheckedCreateNestedManyWithoutNovelInput = {
    create?: XOR<TranslationProjectCreateWithoutNovelInput, TranslationProjectUncheckedCreateWithoutNovelInput> | TranslationProjectCreateWithoutNovelInput[] | TranslationProjectUncheckedCreateWithoutNovelInput[]
    connectOrCreate?: TranslationProjectCreateOrConnectWithoutNovelInput | TranslationProjectCreateOrConnectWithoutNovelInput[]
    createMany?: TranslationProjectCreateManyNovelInputEnvelope
    connect?: TranslationProjectWhereUniqueInput | TranslationProjectWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type ChapterUpdateManyWithoutNovelNestedInput = {
    create?: XOR<ChapterCreateWithoutNovelInput, ChapterUncheckedCreateWithoutNovelInput> | ChapterCreateWithoutNovelInput[] | ChapterUncheckedCreateWithoutNovelInput[]
    connectOrCreate?: ChapterCreateOrConnectWithoutNovelInput | ChapterCreateOrConnectWithoutNovelInput[]
    upsert?: ChapterUpsertWithWhereUniqueWithoutNovelInput | ChapterUpsertWithWhereUniqueWithoutNovelInput[]
    createMany?: ChapterCreateManyNovelInputEnvelope
    set?: ChapterWhereUniqueInput | ChapterWhereUniqueInput[]
    disconnect?: ChapterWhereUniqueInput | ChapterWhereUniqueInput[]
    delete?: ChapterWhereUniqueInput | ChapterWhereUniqueInput[]
    connect?: ChapterWhereUniqueInput | ChapterWhereUniqueInput[]
    update?: ChapterUpdateWithWhereUniqueWithoutNovelInput | ChapterUpdateWithWhereUniqueWithoutNovelInput[]
    updateMany?: ChapterUpdateManyWithWhereWithoutNovelInput | ChapterUpdateManyWithWhereWithoutNovelInput[]
    deleteMany?: ChapterScalarWhereInput | ChapterScalarWhereInput[]
  }

  export type SyncRunUpdateManyWithoutNovelNestedInput = {
    create?: XOR<SyncRunCreateWithoutNovelInput, SyncRunUncheckedCreateWithoutNovelInput> | SyncRunCreateWithoutNovelInput[] | SyncRunUncheckedCreateWithoutNovelInput[]
    connectOrCreate?: SyncRunCreateOrConnectWithoutNovelInput | SyncRunCreateOrConnectWithoutNovelInput[]
    upsert?: SyncRunUpsertWithWhereUniqueWithoutNovelInput | SyncRunUpsertWithWhereUniqueWithoutNovelInput[]
    createMany?: SyncRunCreateManyNovelInputEnvelope
    set?: SyncRunWhereUniqueInput | SyncRunWhereUniqueInput[]
    disconnect?: SyncRunWhereUniqueInput | SyncRunWhereUniqueInput[]
    delete?: SyncRunWhereUniqueInput | SyncRunWhereUniqueInput[]
    connect?: SyncRunWhereUniqueInput | SyncRunWhereUniqueInput[]
    update?: SyncRunUpdateWithWhereUniqueWithoutNovelInput | SyncRunUpdateWithWhereUniqueWithoutNovelInput[]
    updateMany?: SyncRunUpdateManyWithWhereWithoutNovelInput | SyncRunUpdateManyWithWhereWithoutNovelInput[]
    deleteMany?: SyncRunScalarWhereInput | SyncRunScalarWhereInput[]
  }

  export type TranslationProjectUpdateManyWithoutNovelNestedInput = {
    create?: XOR<TranslationProjectCreateWithoutNovelInput, TranslationProjectUncheckedCreateWithoutNovelInput> | TranslationProjectCreateWithoutNovelInput[] | TranslationProjectUncheckedCreateWithoutNovelInput[]
    connectOrCreate?: TranslationProjectCreateOrConnectWithoutNovelInput | TranslationProjectCreateOrConnectWithoutNovelInput[]
    upsert?: TranslationProjectUpsertWithWhereUniqueWithoutNovelInput | TranslationProjectUpsertWithWhereUniqueWithoutNovelInput[]
    createMany?: TranslationProjectCreateManyNovelInputEnvelope
    set?: TranslationProjectWhereUniqueInput | TranslationProjectWhereUniqueInput[]
    disconnect?: TranslationProjectWhereUniqueInput | TranslationProjectWhereUniqueInput[]
    delete?: TranslationProjectWhereUniqueInput | TranslationProjectWhereUniqueInput[]
    connect?: TranslationProjectWhereUniqueInput | TranslationProjectWhereUniqueInput[]
    update?: TranslationProjectUpdateWithWhereUniqueWithoutNovelInput | TranslationProjectUpdateWithWhereUniqueWithoutNovelInput[]
    updateMany?: TranslationProjectUpdateManyWithWhereWithoutNovelInput | TranslationProjectUpdateManyWithWhereWithoutNovelInput[]
    deleteMany?: TranslationProjectScalarWhereInput | TranslationProjectScalarWhereInput[]
  }

  export type ChapterUncheckedUpdateManyWithoutNovelNestedInput = {
    create?: XOR<ChapterCreateWithoutNovelInput, ChapterUncheckedCreateWithoutNovelInput> | ChapterCreateWithoutNovelInput[] | ChapterUncheckedCreateWithoutNovelInput[]
    connectOrCreate?: ChapterCreateOrConnectWithoutNovelInput | ChapterCreateOrConnectWithoutNovelInput[]
    upsert?: ChapterUpsertWithWhereUniqueWithoutNovelInput | ChapterUpsertWithWhereUniqueWithoutNovelInput[]
    createMany?: ChapterCreateManyNovelInputEnvelope
    set?: ChapterWhereUniqueInput | ChapterWhereUniqueInput[]
    disconnect?: ChapterWhereUniqueInput | ChapterWhereUniqueInput[]
    delete?: ChapterWhereUniqueInput | ChapterWhereUniqueInput[]
    connect?: ChapterWhereUniqueInput | ChapterWhereUniqueInput[]
    update?: ChapterUpdateWithWhereUniqueWithoutNovelInput | ChapterUpdateWithWhereUniqueWithoutNovelInput[]
    updateMany?: ChapterUpdateManyWithWhereWithoutNovelInput | ChapterUpdateManyWithWhereWithoutNovelInput[]
    deleteMany?: ChapterScalarWhereInput | ChapterScalarWhereInput[]
  }

  export type SyncRunUncheckedUpdateManyWithoutNovelNestedInput = {
    create?: XOR<SyncRunCreateWithoutNovelInput, SyncRunUncheckedCreateWithoutNovelInput> | SyncRunCreateWithoutNovelInput[] | SyncRunUncheckedCreateWithoutNovelInput[]
    connectOrCreate?: SyncRunCreateOrConnectWithoutNovelInput | SyncRunCreateOrConnectWithoutNovelInput[]
    upsert?: SyncRunUpsertWithWhereUniqueWithoutNovelInput | SyncRunUpsertWithWhereUniqueWithoutNovelInput[]
    createMany?: SyncRunCreateManyNovelInputEnvelope
    set?: SyncRunWhereUniqueInput | SyncRunWhereUniqueInput[]
    disconnect?: SyncRunWhereUniqueInput | SyncRunWhereUniqueInput[]
    delete?: SyncRunWhereUniqueInput | SyncRunWhereUniqueInput[]
    connect?: SyncRunWhereUniqueInput | SyncRunWhereUniqueInput[]
    update?: SyncRunUpdateWithWhereUniqueWithoutNovelInput | SyncRunUpdateWithWhereUniqueWithoutNovelInput[]
    updateMany?: SyncRunUpdateManyWithWhereWithoutNovelInput | SyncRunUpdateManyWithWhereWithoutNovelInput[]
    deleteMany?: SyncRunScalarWhereInput | SyncRunScalarWhereInput[]
  }

  export type TranslationProjectUncheckedUpdateManyWithoutNovelNestedInput = {
    create?: XOR<TranslationProjectCreateWithoutNovelInput, TranslationProjectUncheckedCreateWithoutNovelInput> | TranslationProjectCreateWithoutNovelInput[] | TranslationProjectUncheckedCreateWithoutNovelInput[]
    connectOrCreate?: TranslationProjectCreateOrConnectWithoutNovelInput | TranslationProjectCreateOrConnectWithoutNovelInput[]
    upsert?: TranslationProjectUpsertWithWhereUniqueWithoutNovelInput | TranslationProjectUpsertWithWhereUniqueWithoutNovelInput[]
    createMany?: TranslationProjectCreateManyNovelInputEnvelope
    set?: TranslationProjectWhereUniqueInput | TranslationProjectWhereUniqueInput[]
    disconnect?: TranslationProjectWhereUniqueInput | TranslationProjectWhereUniqueInput[]
    delete?: TranslationProjectWhereUniqueInput | TranslationProjectWhereUniqueInput[]
    connect?: TranslationProjectWhereUniqueInput | TranslationProjectWhereUniqueInput[]
    update?: TranslationProjectUpdateWithWhereUniqueWithoutNovelInput | TranslationProjectUpdateWithWhereUniqueWithoutNovelInput[]
    updateMany?: TranslationProjectUpdateManyWithWhereWithoutNovelInput | TranslationProjectUpdateManyWithWhereWithoutNovelInput[]
    deleteMany?: TranslationProjectScalarWhereInput | TranslationProjectScalarWhereInput[]
  }

  export type NovelCreateNestedOneWithoutChaptersInput = {
    create?: XOR<NovelCreateWithoutChaptersInput, NovelUncheckedCreateWithoutChaptersInput>
    connectOrCreate?: NovelCreateOrConnectWithoutChaptersInput
    connect?: NovelWhereUniqueInput
  }

  export type ChapterTranslationCreateNestedManyWithoutChapterInput = {
    create?: XOR<ChapterTranslationCreateWithoutChapterInput, ChapterTranslationUncheckedCreateWithoutChapterInput> | ChapterTranslationCreateWithoutChapterInput[] | ChapterTranslationUncheckedCreateWithoutChapterInput[]
    connectOrCreate?: ChapterTranslationCreateOrConnectWithoutChapterInput | ChapterTranslationCreateOrConnectWithoutChapterInput[]
    createMany?: ChapterTranslationCreateManyChapterInputEnvelope
    connect?: ChapterTranslationWhereUniqueInput | ChapterTranslationWhereUniqueInput[]
  }

  export type ChapterTranslationUncheckedCreateNestedManyWithoutChapterInput = {
    create?: XOR<ChapterTranslationCreateWithoutChapterInput, ChapterTranslationUncheckedCreateWithoutChapterInput> | ChapterTranslationCreateWithoutChapterInput[] | ChapterTranslationUncheckedCreateWithoutChapterInput[]
    connectOrCreate?: ChapterTranslationCreateOrConnectWithoutChapterInput | ChapterTranslationCreateOrConnectWithoutChapterInput[]
    createMany?: ChapterTranslationCreateManyChapterInputEnvelope
    connect?: ChapterTranslationWhereUniqueInput | ChapterTranslationWhereUniqueInput[]
  }

  export type NullableIntFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type NovelUpdateOneRequiredWithoutChaptersNestedInput = {
    create?: XOR<NovelCreateWithoutChaptersInput, NovelUncheckedCreateWithoutChaptersInput>
    connectOrCreate?: NovelCreateOrConnectWithoutChaptersInput
    upsert?: NovelUpsertWithoutChaptersInput
    connect?: NovelWhereUniqueInput
    update?: XOR<XOR<NovelUpdateToOneWithWhereWithoutChaptersInput, NovelUpdateWithoutChaptersInput>, NovelUncheckedUpdateWithoutChaptersInput>
  }

  export type ChapterTranslationUpdateManyWithoutChapterNestedInput = {
    create?: XOR<ChapterTranslationCreateWithoutChapterInput, ChapterTranslationUncheckedCreateWithoutChapterInput> | ChapterTranslationCreateWithoutChapterInput[] | ChapterTranslationUncheckedCreateWithoutChapterInput[]
    connectOrCreate?: ChapterTranslationCreateOrConnectWithoutChapterInput | ChapterTranslationCreateOrConnectWithoutChapterInput[]
    upsert?: ChapterTranslationUpsertWithWhereUniqueWithoutChapterInput | ChapterTranslationUpsertWithWhereUniqueWithoutChapterInput[]
    createMany?: ChapterTranslationCreateManyChapterInputEnvelope
    set?: ChapterTranslationWhereUniqueInput | ChapterTranslationWhereUniqueInput[]
    disconnect?: ChapterTranslationWhereUniqueInput | ChapterTranslationWhereUniqueInput[]
    delete?: ChapterTranslationWhereUniqueInput | ChapterTranslationWhereUniqueInput[]
    connect?: ChapterTranslationWhereUniqueInput | ChapterTranslationWhereUniqueInput[]
    update?: ChapterTranslationUpdateWithWhereUniqueWithoutChapterInput | ChapterTranslationUpdateWithWhereUniqueWithoutChapterInput[]
    updateMany?: ChapterTranslationUpdateManyWithWhereWithoutChapterInput | ChapterTranslationUpdateManyWithWhereWithoutChapterInput[]
    deleteMany?: ChapterTranslationScalarWhereInput | ChapterTranslationScalarWhereInput[]
  }

  export type ChapterTranslationUncheckedUpdateManyWithoutChapterNestedInput = {
    create?: XOR<ChapterTranslationCreateWithoutChapterInput, ChapterTranslationUncheckedCreateWithoutChapterInput> | ChapterTranslationCreateWithoutChapterInput[] | ChapterTranslationUncheckedCreateWithoutChapterInput[]
    connectOrCreate?: ChapterTranslationCreateOrConnectWithoutChapterInput | ChapterTranslationCreateOrConnectWithoutChapterInput[]
    upsert?: ChapterTranslationUpsertWithWhereUniqueWithoutChapterInput | ChapterTranslationUpsertWithWhereUniqueWithoutChapterInput[]
    createMany?: ChapterTranslationCreateManyChapterInputEnvelope
    set?: ChapterTranslationWhereUniqueInput | ChapterTranslationWhereUniqueInput[]
    disconnect?: ChapterTranslationWhereUniqueInput | ChapterTranslationWhereUniqueInput[]
    delete?: ChapterTranslationWhereUniqueInput | ChapterTranslationWhereUniqueInput[]
    connect?: ChapterTranslationWhereUniqueInput | ChapterTranslationWhereUniqueInput[]
    update?: ChapterTranslationUpdateWithWhereUniqueWithoutChapterInput | ChapterTranslationUpdateWithWhereUniqueWithoutChapterInput[]
    updateMany?: ChapterTranslationUpdateManyWithWhereWithoutChapterInput | ChapterTranslationUpdateManyWithWhereWithoutChapterInput[]
    deleteMany?: ChapterTranslationScalarWhereInput | ChapterTranslationScalarWhereInput[]
  }

  export type NovelCreateNestedOneWithoutSyncRunsInput = {
    create?: XOR<NovelCreateWithoutSyncRunsInput, NovelUncheckedCreateWithoutSyncRunsInput>
    connectOrCreate?: NovelCreateOrConnectWithoutSyncRunsInput
    connect?: NovelWhereUniqueInput
  }

  export type NovelUpdateOneRequiredWithoutSyncRunsNestedInput = {
    create?: XOR<NovelCreateWithoutSyncRunsInput, NovelUncheckedCreateWithoutSyncRunsInput>
    connectOrCreate?: NovelCreateOrConnectWithoutSyncRunsInput
    upsert?: NovelUpsertWithoutSyncRunsInput
    connect?: NovelWhereUniqueInput
    update?: XOR<XOR<NovelUpdateToOneWithWhereWithoutSyncRunsInput, NovelUpdateWithoutSyncRunsInput>, NovelUncheckedUpdateWithoutSyncRunsInput>
  }

  export type NovelCreateNestedOneWithoutTranslationProjectsInput = {
    create?: XOR<NovelCreateWithoutTranslationProjectsInput, NovelUncheckedCreateWithoutTranslationProjectsInput>
    connectOrCreate?: NovelCreateOrConnectWithoutTranslationProjectsInput
    connect?: NovelWhereUniqueInput
  }

  export type TranslationGlossaryCreateNestedManyWithoutProjectInput = {
    create?: XOR<TranslationGlossaryCreateWithoutProjectInput, TranslationGlossaryUncheckedCreateWithoutProjectInput> | TranslationGlossaryCreateWithoutProjectInput[] | TranslationGlossaryUncheckedCreateWithoutProjectInput[]
    connectOrCreate?: TranslationGlossaryCreateOrConnectWithoutProjectInput | TranslationGlossaryCreateOrConnectWithoutProjectInput[]
    createMany?: TranslationGlossaryCreateManyProjectInputEnvelope
    connect?: TranslationGlossaryWhereUniqueInput | TranslationGlossaryWhereUniqueInput[]
  }

  export type ChapterTranslationCreateNestedManyWithoutProjectInput = {
    create?: XOR<ChapterTranslationCreateWithoutProjectInput, ChapterTranslationUncheckedCreateWithoutProjectInput> | ChapterTranslationCreateWithoutProjectInput[] | ChapterTranslationUncheckedCreateWithoutProjectInput[]
    connectOrCreate?: ChapterTranslationCreateOrConnectWithoutProjectInput | ChapterTranslationCreateOrConnectWithoutProjectInput[]
    createMany?: ChapterTranslationCreateManyProjectInputEnvelope
    connect?: ChapterTranslationWhereUniqueInput | ChapterTranslationWhereUniqueInput[]
  }

  export type TranslationRunCreateNestedManyWithoutProjectInput = {
    create?: XOR<TranslationRunCreateWithoutProjectInput, TranslationRunUncheckedCreateWithoutProjectInput> | TranslationRunCreateWithoutProjectInput[] | TranslationRunUncheckedCreateWithoutProjectInput[]
    connectOrCreate?: TranslationRunCreateOrConnectWithoutProjectInput | TranslationRunCreateOrConnectWithoutProjectInput[]
    createMany?: TranslationRunCreateManyProjectInputEnvelope
    connect?: TranslationRunWhereUniqueInput | TranslationRunWhereUniqueInput[]
  }

  export type TranslationGlossaryUncheckedCreateNestedManyWithoutProjectInput = {
    create?: XOR<TranslationGlossaryCreateWithoutProjectInput, TranslationGlossaryUncheckedCreateWithoutProjectInput> | TranslationGlossaryCreateWithoutProjectInput[] | TranslationGlossaryUncheckedCreateWithoutProjectInput[]
    connectOrCreate?: TranslationGlossaryCreateOrConnectWithoutProjectInput | TranslationGlossaryCreateOrConnectWithoutProjectInput[]
    createMany?: TranslationGlossaryCreateManyProjectInputEnvelope
    connect?: TranslationGlossaryWhereUniqueInput | TranslationGlossaryWhereUniqueInput[]
  }

  export type ChapterTranslationUncheckedCreateNestedManyWithoutProjectInput = {
    create?: XOR<ChapterTranslationCreateWithoutProjectInput, ChapterTranslationUncheckedCreateWithoutProjectInput> | ChapterTranslationCreateWithoutProjectInput[] | ChapterTranslationUncheckedCreateWithoutProjectInput[]
    connectOrCreate?: ChapterTranslationCreateOrConnectWithoutProjectInput | ChapterTranslationCreateOrConnectWithoutProjectInput[]
    createMany?: ChapterTranslationCreateManyProjectInputEnvelope
    connect?: ChapterTranslationWhereUniqueInput | ChapterTranslationWhereUniqueInput[]
  }

  export type TranslationRunUncheckedCreateNestedManyWithoutProjectInput = {
    create?: XOR<TranslationRunCreateWithoutProjectInput, TranslationRunUncheckedCreateWithoutProjectInput> | TranslationRunCreateWithoutProjectInput[] | TranslationRunUncheckedCreateWithoutProjectInput[]
    connectOrCreate?: TranslationRunCreateOrConnectWithoutProjectInput | TranslationRunCreateOrConnectWithoutProjectInput[]
    createMany?: TranslationRunCreateManyProjectInputEnvelope
    connect?: TranslationRunWhereUniqueInput | TranslationRunWhereUniqueInput[]
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type NovelUpdateOneRequiredWithoutTranslationProjectsNestedInput = {
    create?: XOR<NovelCreateWithoutTranslationProjectsInput, NovelUncheckedCreateWithoutTranslationProjectsInput>
    connectOrCreate?: NovelCreateOrConnectWithoutTranslationProjectsInput
    upsert?: NovelUpsertWithoutTranslationProjectsInput
    connect?: NovelWhereUniqueInput
    update?: XOR<XOR<NovelUpdateToOneWithWhereWithoutTranslationProjectsInput, NovelUpdateWithoutTranslationProjectsInput>, NovelUncheckedUpdateWithoutTranslationProjectsInput>
  }

  export type TranslationGlossaryUpdateManyWithoutProjectNestedInput = {
    create?: XOR<TranslationGlossaryCreateWithoutProjectInput, TranslationGlossaryUncheckedCreateWithoutProjectInput> | TranslationGlossaryCreateWithoutProjectInput[] | TranslationGlossaryUncheckedCreateWithoutProjectInput[]
    connectOrCreate?: TranslationGlossaryCreateOrConnectWithoutProjectInput | TranslationGlossaryCreateOrConnectWithoutProjectInput[]
    upsert?: TranslationGlossaryUpsertWithWhereUniqueWithoutProjectInput | TranslationGlossaryUpsertWithWhereUniqueWithoutProjectInput[]
    createMany?: TranslationGlossaryCreateManyProjectInputEnvelope
    set?: TranslationGlossaryWhereUniqueInput | TranslationGlossaryWhereUniqueInput[]
    disconnect?: TranslationGlossaryWhereUniqueInput | TranslationGlossaryWhereUniqueInput[]
    delete?: TranslationGlossaryWhereUniqueInput | TranslationGlossaryWhereUniqueInput[]
    connect?: TranslationGlossaryWhereUniqueInput | TranslationGlossaryWhereUniqueInput[]
    update?: TranslationGlossaryUpdateWithWhereUniqueWithoutProjectInput | TranslationGlossaryUpdateWithWhereUniqueWithoutProjectInput[]
    updateMany?: TranslationGlossaryUpdateManyWithWhereWithoutProjectInput | TranslationGlossaryUpdateManyWithWhereWithoutProjectInput[]
    deleteMany?: TranslationGlossaryScalarWhereInput | TranslationGlossaryScalarWhereInput[]
  }

  export type ChapterTranslationUpdateManyWithoutProjectNestedInput = {
    create?: XOR<ChapterTranslationCreateWithoutProjectInput, ChapterTranslationUncheckedCreateWithoutProjectInput> | ChapterTranslationCreateWithoutProjectInput[] | ChapterTranslationUncheckedCreateWithoutProjectInput[]
    connectOrCreate?: ChapterTranslationCreateOrConnectWithoutProjectInput | ChapterTranslationCreateOrConnectWithoutProjectInput[]
    upsert?: ChapterTranslationUpsertWithWhereUniqueWithoutProjectInput | ChapterTranslationUpsertWithWhereUniqueWithoutProjectInput[]
    createMany?: ChapterTranslationCreateManyProjectInputEnvelope
    set?: ChapterTranslationWhereUniqueInput | ChapterTranslationWhereUniqueInput[]
    disconnect?: ChapterTranslationWhereUniqueInput | ChapterTranslationWhereUniqueInput[]
    delete?: ChapterTranslationWhereUniqueInput | ChapterTranslationWhereUniqueInput[]
    connect?: ChapterTranslationWhereUniqueInput | ChapterTranslationWhereUniqueInput[]
    update?: ChapterTranslationUpdateWithWhereUniqueWithoutProjectInput | ChapterTranslationUpdateWithWhereUniqueWithoutProjectInput[]
    updateMany?: ChapterTranslationUpdateManyWithWhereWithoutProjectInput | ChapterTranslationUpdateManyWithWhereWithoutProjectInput[]
    deleteMany?: ChapterTranslationScalarWhereInput | ChapterTranslationScalarWhereInput[]
  }

  export type TranslationRunUpdateManyWithoutProjectNestedInput = {
    create?: XOR<TranslationRunCreateWithoutProjectInput, TranslationRunUncheckedCreateWithoutProjectInput> | TranslationRunCreateWithoutProjectInput[] | TranslationRunUncheckedCreateWithoutProjectInput[]
    connectOrCreate?: TranslationRunCreateOrConnectWithoutProjectInput | TranslationRunCreateOrConnectWithoutProjectInput[]
    upsert?: TranslationRunUpsertWithWhereUniqueWithoutProjectInput | TranslationRunUpsertWithWhereUniqueWithoutProjectInput[]
    createMany?: TranslationRunCreateManyProjectInputEnvelope
    set?: TranslationRunWhereUniqueInput | TranslationRunWhereUniqueInput[]
    disconnect?: TranslationRunWhereUniqueInput | TranslationRunWhereUniqueInput[]
    delete?: TranslationRunWhereUniqueInput | TranslationRunWhereUniqueInput[]
    connect?: TranslationRunWhereUniqueInput | TranslationRunWhereUniqueInput[]
    update?: TranslationRunUpdateWithWhereUniqueWithoutProjectInput | TranslationRunUpdateWithWhereUniqueWithoutProjectInput[]
    updateMany?: TranslationRunUpdateManyWithWhereWithoutProjectInput | TranslationRunUpdateManyWithWhereWithoutProjectInput[]
    deleteMany?: TranslationRunScalarWhereInput | TranslationRunScalarWhereInput[]
  }

  export type TranslationGlossaryUncheckedUpdateManyWithoutProjectNestedInput = {
    create?: XOR<TranslationGlossaryCreateWithoutProjectInput, TranslationGlossaryUncheckedCreateWithoutProjectInput> | TranslationGlossaryCreateWithoutProjectInput[] | TranslationGlossaryUncheckedCreateWithoutProjectInput[]
    connectOrCreate?: TranslationGlossaryCreateOrConnectWithoutProjectInput | TranslationGlossaryCreateOrConnectWithoutProjectInput[]
    upsert?: TranslationGlossaryUpsertWithWhereUniqueWithoutProjectInput | TranslationGlossaryUpsertWithWhereUniqueWithoutProjectInput[]
    createMany?: TranslationGlossaryCreateManyProjectInputEnvelope
    set?: TranslationGlossaryWhereUniqueInput | TranslationGlossaryWhereUniqueInput[]
    disconnect?: TranslationGlossaryWhereUniqueInput | TranslationGlossaryWhereUniqueInput[]
    delete?: TranslationGlossaryWhereUniqueInput | TranslationGlossaryWhereUniqueInput[]
    connect?: TranslationGlossaryWhereUniqueInput | TranslationGlossaryWhereUniqueInput[]
    update?: TranslationGlossaryUpdateWithWhereUniqueWithoutProjectInput | TranslationGlossaryUpdateWithWhereUniqueWithoutProjectInput[]
    updateMany?: TranslationGlossaryUpdateManyWithWhereWithoutProjectInput | TranslationGlossaryUpdateManyWithWhereWithoutProjectInput[]
    deleteMany?: TranslationGlossaryScalarWhereInput | TranslationGlossaryScalarWhereInput[]
  }

  export type ChapterTranslationUncheckedUpdateManyWithoutProjectNestedInput = {
    create?: XOR<ChapterTranslationCreateWithoutProjectInput, ChapterTranslationUncheckedCreateWithoutProjectInput> | ChapterTranslationCreateWithoutProjectInput[] | ChapterTranslationUncheckedCreateWithoutProjectInput[]
    connectOrCreate?: ChapterTranslationCreateOrConnectWithoutProjectInput | ChapterTranslationCreateOrConnectWithoutProjectInput[]
    upsert?: ChapterTranslationUpsertWithWhereUniqueWithoutProjectInput | ChapterTranslationUpsertWithWhereUniqueWithoutProjectInput[]
    createMany?: ChapterTranslationCreateManyProjectInputEnvelope
    set?: ChapterTranslationWhereUniqueInput | ChapterTranslationWhereUniqueInput[]
    disconnect?: ChapterTranslationWhereUniqueInput | ChapterTranslationWhereUniqueInput[]
    delete?: ChapterTranslationWhereUniqueInput | ChapterTranslationWhereUniqueInput[]
    connect?: ChapterTranslationWhereUniqueInput | ChapterTranslationWhereUniqueInput[]
    update?: ChapterTranslationUpdateWithWhereUniqueWithoutProjectInput | ChapterTranslationUpdateWithWhereUniqueWithoutProjectInput[]
    updateMany?: ChapterTranslationUpdateManyWithWhereWithoutProjectInput | ChapterTranslationUpdateManyWithWhereWithoutProjectInput[]
    deleteMany?: ChapterTranslationScalarWhereInput | ChapterTranslationScalarWhereInput[]
  }

  export type TranslationRunUncheckedUpdateManyWithoutProjectNestedInput = {
    create?: XOR<TranslationRunCreateWithoutProjectInput, TranslationRunUncheckedCreateWithoutProjectInput> | TranslationRunCreateWithoutProjectInput[] | TranslationRunUncheckedCreateWithoutProjectInput[]
    connectOrCreate?: TranslationRunCreateOrConnectWithoutProjectInput | TranslationRunCreateOrConnectWithoutProjectInput[]
    upsert?: TranslationRunUpsertWithWhereUniqueWithoutProjectInput | TranslationRunUpsertWithWhereUniqueWithoutProjectInput[]
    createMany?: TranslationRunCreateManyProjectInputEnvelope
    set?: TranslationRunWhereUniqueInput | TranslationRunWhereUniqueInput[]
    disconnect?: TranslationRunWhereUniqueInput | TranslationRunWhereUniqueInput[]
    delete?: TranslationRunWhereUniqueInput | TranslationRunWhereUniqueInput[]
    connect?: TranslationRunWhereUniqueInput | TranslationRunWhereUniqueInput[]
    update?: TranslationRunUpdateWithWhereUniqueWithoutProjectInput | TranslationRunUpdateWithWhereUniqueWithoutProjectInput[]
    updateMany?: TranslationRunUpdateManyWithWhereWithoutProjectInput | TranslationRunUpdateManyWithWhereWithoutProjectInput[]
    deleteMany?: TranslationRunScalarWhereInput | TranslationRunScalarWhereInput[]
  }

  export type TranslationProjectCreateNestedOneWithoutGlossariesInput = {
    create?: XOR<TranslationProjectCreateWithoutGlossariesInput, TranslationProjectUncheckedCreateWithoutGlossariesInput>
    connectOrCreate?: TranslationProjectCreateOrConnectWithoutGlossariesInput
    connect?: TranslationProjectWhereUniqueInput
  }

  export type TranslationGlossaryEntryCreateNestedManyWithoutGlossaryInput = {
    create?: XOR<TranslationGlossaryEntryCreateWithoutGlossaryInput, TranslationGlossaryEntryUncheckedCreateWithoutGlossaryInput> | TranslationGlossaryEntryCreateWithoutGlossaryInput[] | TranslationGlossaryEntryUncheckedCreateWithoutGlossaryInput[]
    connectOrCreate?: TranslationGlossaryEntryCreateOrConnectWithoutGlossaryInput | TranslationGlossaryEntryCreateOrConnectWithoutGlossaryInput[]
    createMany?: TranslationGlossaryEntryCreateManyGlossaryInputEnvelope
    connect?: TranslationGlossaryEntryWhereUniqueInput | TranslationGlossaryEntryWhereUniqueInput[]
  }

  export type TranslationGlossaryEntryUncheckedCreateNestedManyWithoutGlossaryInput = {
    create?: XOR<TranslationGlossaryEntryCreateWithoutGlossaryInput, TranslationGlossaryEntryUncheckedCreateWithoutGlossaryInput> | TranslationGlossaryEntryCreateWithoutGlossaryInput[] | TranslationGlossaryEntryUncheckedCreateWithoutGlossaryInput[]
    connectOrCreate?: TranslationGlossaryEntryCreateOrConnectWithoutGlossaryInput | TranslationGlossaryEntryCreateOrConnectWithoutGlossaryInput[]
    createMany?: TranslationGlossaryEntryCreateManyGlossaryInputEnvelope
    connect?: TranslationGlossaryEntryWhereUniqueInput | TranslationGlossaryEntryWhereUniqueInput[]
  }

  export type TranslationProjectUpdateOneRequiredWithoutGlossariesNestedInput = {
    create?: XOR<TranslationProjectCreateWithoutGlossariesInput, TranslationProjectUncheckedCreateWithoutGlossariesInput>
    connectOrCreate?: TranslationProjectCreateOrConnectWithoutGlossariesInput
    upsert?: TranslationProjectUpsertWithoutGlossariesInput
    connect?: TranslationProjectWhereUniqueInput
    update?: XOR<XOR<TranslationProjectUpdateToOneWithWhereWithoutGlossariesInput, TranslationProjectUpdateWithoutGlossariesInput>, TranslationProjectUncheckedUpdateWithoutGlossariesInput>
  }

  export type TranslationGlossaryEntryUpdateManyWithoutGlossaryNestedInput = {
    create?: XOR<TranslationGlossaryEntryCreateWithoutGlossaryInput, TranslationGlossaryEntryUncheckedCreateWithoutGlossaryInput> | TranslationGlossaryEntryCreateWithoutGlossaryInput[] | TranslationGlossaryEntryUncheckedCreateWithoutGlossaryInput[]
    connectOrCreate?: TranslationGlossaryEntryCreateOrConnectWithoutGlossaryInput | TranslationGlossaryEntryCreateOrConnectWithoutGlossaryInput[]
    upsert?: TranslationGlossaryEntryUpsertWithWhereUniqueWithoutGlossaryInput | TranslationGlossaryEntryUpsertWithWhereUniqueWithoutGlossaryInput[]
    createMany?: TranslationGlossaryEntryCreateManyGlossaryInputEnvelope
    set?: TranslationGlossaryEntryWhereUniqueInput | TranslationGlossaryEntryWhereUniqueInput[]
    disconnect?: TranslationGlossaryEntryWhereUniqueInput | TranslationGlossaryEntryWhereUniqueInput[]
    delete?: TranslationGlossaryEntryWhereUniqueInput | TranslationGlossaryEntryWhereUniqueInput[]
    connect?: TranslationGlossaryEntryWhereUniqueInput | TranslationGlossaryEntryWhereUniqueInput[]
    update?: TranslationGlossaryEntryUpdateWithWhereUniqueWithoutGlossaryInput | TranslationGlossaryEntryUpdateWithWhereUniqueWithoutGlossaryInput[]
    updateMany?: TranslationGlossaryEntryUpdateManyWithWhereWithoutGlossaryInput | TranslationGlossaryEntryUpdateManyWithWhereWithoutGlossaryInput[]
    deleteMany?: TranslationGlossaryEntryScalarWhereInput | TranslationGlossaryEntryScalarWhereInput[]
  }

  export type TranslationGlossaryEntryUncheckedUpdateManyWithoutGlossaryNestedInput = {
    create?: XOR<TranslationGlossaryEntryCreateWithoutGlossaryInput, TranslationGlossaryEntryUncheckedCreateWithoutGlossaryInput> | TranslationGlossaryEntryCreateWithoutGlossaryInput[] | TranslationGlossaryEntryUncheckedCreateWithoutGlossaryInput[]
    connectOrCreate?: TranslationGlossaryEntryCreateOrConnectWithoutGlossaryInput | TranslationGlossaryEntryCreateOrConnectWithoutGlossaryInput[]
    upsert?: TranslationGlossaryEntryUpsertWithWhereUniqueWithoutGlossaryInput | TranslationGlossaryEntryUpsertWithWhereUniqueWithoutGlossaryInput[]
    createMany?: TranslationGlossaryEntryCreateManyGlossaryInputEnvelope
    set?: TranslationGlossaryEntryWhereUniqueInput | TranslationGlossaryEntryWhereUniqueInput[]
    disconnect?: TranslationGlossaryEntryWhereUniqueInput | TranslationGlossaryEntryWhereUniqueInput[]
    delete?: TranslationGlossaryEntryWhereUniqueInput | TranslationGlossaryEntryWhereUniqueInput[]
    connect?: TranslationGlossaryEntryWhereUniqueInput | TranslationGlossaryEntryWhereUniqueInput[]
    update?: TranslationGlossaryEntryUpdateWithWhereUniqueWithoutGlossaryInput | TranslationGlossaryEntryUpdateWithWhereUniqueWithoutGlossaryInput[]
    updateMany?: TranslationGlossaryEntryUpdateManyWithWhereWithoutGlossaryInput | TranslationGlossaryEntryUpdateManyWithWhereWithoutGlossaryInput[]
    deleteMany?: TranslationGlossaryEntryScalarWhereInput | TranslationGlossaryEntryScalarWhereInput[]
  }

  export type TranslationGlossaryCreateNestedOneWithoutEntriesInput = {
    create?: XOR<TranslationGlossaryCreateWithoutEntriesInput, TranslationGlossaryUncheckedCreateWithoutEntriesInput>
    connectOrCreate?: TranslationGlossaryCreateOrConnectWithoutEntriesInput
    connect?: TranslationGlossaryWhereUniqueInput
  }

  export type TranslationGlossaryUpdateOneRequiredWithoutEntriesNestedInput = {
    create?: XOR<TranslationGlossaryCreateWithoutEntriesInput, TranslationGlossaryUncheckedCreateWithoutEntriesInput>
    connectOrCreate?: TranslationGlossaryCreateOrConnectWithoutEntriesInput
    upsert?: TranslationGlossaryUpsertWithoutEntriesInput
    connect?: TranslationGlossaryWhereUniqueInput
    update?: XOR<XOR<TranslationGlossaryUpdateToOneWithWhereWithoutEntriesInput, TranslationGlossaryUpdateWithoutEntriesInput>, TranslationGlossaryUncheckedUpdateWithoutEntriesInput>
  }

  export type TranslationProjectCreateNestedOneWithoutChapterTranslationsInput = {
    create?: XOR<TranslationProjectCreateWithoutChapterTranslationsInput, TranslationProjectUncheckedCreateWithoutChapterTranslationsInput>
    connectOrCreate?: TranslationProjectCreateOrConnectWithoutChapterTranslationsInput
    connect?: TranslationProjectWhereUniqueInput
  }

  export type ChapterCreateNestedOneWithoutTranslationsInput = {
    create?: XOR<ChapterCreateWithoutTranslationsInput, ChapterUncheckedCreateWithoutTranslationsInput>
    connectOrCreate?: ChapterCreateOrConnectWithoutTranslationsInput
    connect?: ChapterWhereUniqueInput
  }

  export type ChapterTranslationVersionCreateNestedManyWithoutChapterTranslationInput = {
    create?: XOR<ChapterTranslationVersionCreateWithoutChapterTranslationInput, ChapterTranslationVersionUncheckedCreateWithoutChapterTranslationInput> | ChapterTranslationVersionCreateWithoutChapterTranslationInput[] | ChapterTranslationVersionUncheckedCreateWithoutChapterTranslationInput[]
    connectOrCreate?: ChapterTranslationVersionCreateOrConnectWithoutChapterTranslationInput | ChapterTranslationVersionCreateOrConnectWithoutChapterTranslationInput[]
    createMany?: ChapterTranslationVersionCreateManyChapterTranslationInputEnvelope
    connect?: ChapterTranslationVersionWhereUniqueInput | ChapterTranslationVersionWhereUniqueInput[]
  }

  export type ChapterTranslationVersionUncheckedCreateNestedManyWithoutChapterTranslationInput = {
    create?: XOR<ChapterTranslationVersionCreateWithoutChapterTranslationInput, ChapterTranslationVersionUncheckedCreateWithoutChapterTranslationInput> | ChapterTranslationVersionCreateWithoutChapterTranslationInput[] | ChapterTranslationVersionUncheckedCreateWithoutChapterTranslationInput[]
    connectOrCreate?: ChapterTranslationVersionCreateOrConnectWithoutChapterTranslationInput | ChapterTranslationVersionCreateOrConnectWithoutChapterTranslationInput[]
    createMany?: ChapterTranslationVersionCreateManyChapterTranslationInputEnvelope
    connect?: ChapterTranslationVersionWhereUniqueInput | ChapterTranslationVersionWhereUniqueInput[]
  }

  export type TranslationProjectUpdateOneRequiredWithoutChapterTranslationsNestedInput = {
    create?: XOR<TranslationProjectCreateWithoutChapterTranslationsInput, TranslationProjectUncheckedCreateWithoutChapterTranslationsInput>
    connectOrCreate?: TranslationProjectCreateOrConnectWithoutChapterTranslationsInput
    upsert?: TranslationProjectUpsertWithoutChapterTranslationsInput
    connect?: TranslationProjectWhereUniqueInput
    update?: XOR<XOR<TranslationProjectUpdateToOneWithWhereWithoutChapterTranslationsInput, TranslationProjectUpdateWithoutChapterTranslationsInput>, TranslationProjectUncheckedUpdateWithoutChapterTranslationsInput>
  }

  export type ChapterUpdateOneRequiredWithoutTranslationsNestedInput = {
    create?: XOR<ChapterCreateWithoutTranslationsInput, ChapterUncheckedCreateWithoutTranslationsInput>
    connectOrCreate?: ChapterCreateOrConnectWithoutTranslationsInput
    upsert?: ChapterUpsertWithoutTranslationsInput
    connect?: ChapterWhereUniqueInput
    update?: XOR<XOR<ChapterUpdateToOneWithWhereWithoutTranslationsInput, ChapterUpdateWithoutTranslationsInput>, ChapterUncheckedUpdateWithoutTranslationsInput>
  }

  export type ChapterTranslationVersionUpdateManyWithoutChapterTranslationNestedInput = {
    create?: XOR<ChapterTranslationVersionCreateWithoutChapterTranslationInput, ChapterTranslationVersionUncheckedCreateWithoutChapterTranslationInput> | ChapterTranslationVersionCreateWithoutChapterTranslationInput[] | ChapterTranslationVersionUncheckedCreateWithoutChapterTranslationInput[]
    connectOrCreate?: ChapterTranslationVersionCreateOrConnectWithoutChapterTranslationInput | ChapterTranslationVersionCreateOrConnectWithoutChapterTranslationInput[]
    upsert?: ChapterTranslationVersionUpsertWithWhereUniqueWithoutChapterTranslationInput | ChapterTranslationVersionUpsertWithWhereUniqueWithoutChapterTranslationInput[]
    createMany?: ChapterTranslationVersionCreateManyChapterTranslationInputEnvelope
    set?: ChapterTranslationVersionWhereUniqueInput | ChapterTranslationVersionWhereUniqueInput[]
    disconnect?: ChapterTranslationVersionWhereUniqueInput | ChapterTranslationVersionWhereUniqueInput[]
    delete?: ChapterTranslationVersionWhereUniqueInput | ChapterTranslationVersionWhereUniqueInput[]
    connect?: ChapterTranslationVersionWhereUniqueInput | ChapterTranslationVersionWhereUniqueInput[]
    update?: ChapterTranslationVersionUpdateWithWhereUniqueWithoutChapterTranslationInput | ChapterTranslationVersionUpdateWithWhereUniqueWithoutChapterTranslationInput[]
    updateMany?: ChapterTranslationVersionUpdateManyWithWhereWithoutChapterTranslationInput | ChapterTranslationVersionUpdateManyWithWhereWithoutChapterTranslationInput[]
    deleteMany?: ChapterTranslationVersionScalarWhereInput | ChapterTranslationVersionScalarWhereInput[]
  }

  export type ChapterTranslationVersionUncheckedUpdateManyWithoutChapterTranslationNestedInput = {
    create?: XOR<ChapterTranslationVersionCreateWithoutChapterTranslationInput, ChapterTranslationVersionUncheckedCreateWithoutChapterTranslationInput> | ChapterTranslationVersionCreateWithoutChapterTranslationInput[] | ChapterTranslationVersionUncheckedCreateWithoutChapterTranslationInput[]
    connectOrCreate?: ChapterTranslationVersionCreateOrConnectWithoutChapterTranslationInput | ChapterTranslationVersionCreateOrConnectWithoutChapterTranslationInput[]
    upsert?: ChapterTranslationVersionUpsertWithWhereUniqueWithoutChapterTranslationInput | ChapterTranslationVersionUpsertWithWhereUniqueWithoutChapterTranslationInput[]
    createMany?: ChapterTranslationVersionCreateManyChapterTranslationInputEnvelope
    set?: ChapterTranslationVersionWhereUniqueInput | ChapterTranslationVersionWhereUniqueInput[]
    disconnect?: ChapterTranslationVersionWhereUniqueInput | ChapterTranslationVersionWhereUniqueInput[]
    delete?: ChapterTranslationVersionWhereUniqueInput | ChapterTranslationVersionWhereUniqueInput[]
    connect?: ChapterTranslationVersionWhereUniqueInput | ChapterTranslationVersionWhereUniqueInput[]
    update?: ChapterTranslationVersionUpdateWithWhereUniqueWithoutChapterTranslationInput | ChapterTranslationVersionUpdateWithWhereUniqueWithoutChapterTranslationInput[]
    updateMany?: ChapterTranslationVersionUpdateManyWithWhereWithoutChapterTranslationInput | ChapterTranslationVersionUpdateManyWithWhereWithoutChapterTranslationInput[]
    deleteMany?: ChapterTranslationVersionScalarWhereInput | ChapterTranslationVersionScalarWhereInput[]
  }

  export type ChapterTranslationCreateNestedOneWithoutVersionsInput = {
    create?: XOR<ChapterTranslationCreateWithoutVersionsInput, ChapterTranslationUncheckedCreateWithoutVersionsInput>
    connectOrCreate?: ChapterTranslationCreateOrConnectWithoutVersionsInput
    connect?: ChapterTranslationWhereUniqueInput
  }

  export type ChapterTranslationUpdateOneRequiredWithoutVersionsNestedInput = {
    create?: XOR<ChapterTranslationCreateWithoutVersionsInput, ChapterTranslationUncheckedCreateWithoutVersionsInput>
    connectOrCreate?: ChapterTranslationCreateOrConnectWithoutVersionsInput
    upsert?: ChapterTranslationUpsertWithoutVersionsInput
    connect?: ChapterTranslationWhereUniqueInput
    update?: XOR<XOR<ChapterTranslationUpdateToOneWithWhereWithoutVersionsInput, ChapterTranslationUpdateWithoutVersionsInput>, ChapterTranslationUncheckedUpdateWithoutVersionsInput>
  }

  export type TranslationProjectCreateNestedOneWithoutRunsInput = {
    create?: XOR<TranslationProjectCreateWithoutRunsInput, TranslationProjectUncheckedCreateWithoutRunsInput>
    connectOrCreate?: TranslationProjectCreateOrConnectWithoutRunsInput
    connect?: TranslationProjectWhereUniqueInput
  }

  export type FloatFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type TranslationProjectUpdateOneRequiredWithoutRunsNestedInput = {
    create?: XOR<TranslationProjectCreateWithoutRunsInput, TranslationProjectUncheckedCreateWithoutRunsInput>
    connectOrCreate?: TranslationProjectCreateOrConnectWithoutRunsInput
    upsert?: TranslationProjectUpsertWithoutRunsInput
    connect?: TranslationProjectWhereUniqueInput
    update?: XOR<XOR<TranslationProjectUpdateToOneWithWhereWithoutRunsInput, TranslationProjectUpdateWithoutRunsInput>, TranslationProjectUncheckedUpdateWithoutRunsInput>
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedIntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedFloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedFloatFilter<$PrismaModel>
    _min?: NestedFloatFilter<$PrismaModel>
    _max?: NestedFloatFilter<$PrismaModel>
  }

  export type ChapterCreateWithoutNovelInput = {
    id?: string
    chapterIndex: number
    title: string
    sourceUrl: string
    status?: string
    epubPath?: string | null
    fileSize?: number | null
    checksum?: string | null
    retryCount?: number
    publishedAt?: Date | string | null
    lastError?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    translations?: ChapterTranslationCreateNestedManyWithoutChapterInput
  }

  export type ChapterUncheckedCreateWithoutNovelInput = {
    id?: string
    chapterIndex: number
    title: string
    sourceUrl: string
    status?: string
    epubPath?: string | null
    fileSize?: number | null
    checksum?: string | null
    retryCount?: number
    publishedAt?: Date | string | null
    lastError?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    translations?: ChapterTranslationUncheckedCreateNestedManyWithoutChapterInput
  }

  export type ChapterCreateOrConnectWithoutNovelInput = {
    where: ChapterWhereUniqueInput
    create: XOR<ChapterCreateWithoutNovelInput, ChapterUncheckedCreateWithoutNovelInput>
  }

  export type ChapterCreateManyNovelInputEnvelope = {
    data: ChapterCreateManyNovelInput | ChapterCreateManyNovelInput[]
  }

  export type SyncRunCreateWithoutNovelInput = {
    id?: string
    triggerType: string
    status?: string
    totalFound?: number
    newChapters?: number
    errorMessage?: string | null
    startedAt?: Date | string | null
    endedAt?: Date | string | null
    createdAt?: Date | string
  }

  export type SyncRunUncheckedCreateWithoutNovelInput = {
    id?: string
    triggerType: string
    status?: string
    totalFound?: number
    newChapters?: number
    errorMessage?: string | null
    startedAt?: Date | string | null
    endedAt?: Date | string | null
    createdAt?: Date | string
  }

  export type SyncRunCreateOrConnectWithoutNovelInput = {
    where: SyncRunWhereUniqueInput
    create: XOR<SyncRunCreateWithoutNovelInput, SyncRunUncheckedCreateWithoutNovelInput>
  }

  export type SyncRunCreateManyNovelInputEnvelope = {
    data: SyncRunCreateManyNovelInput | SyncRunCreateManyNovelInput[]
  }

  export type TranslationProjectCreateWithoutNovelInput = {
    id?: string
    name: string
    targetLanguage?: string
    provider?: string
    model?: string
    systemPrompt?: string | null
    styleGuideJson?: string
    contextMode?: string
    historyDepth?: number
    autoTranslateNewChapters?: boolean
    chapterConcurrency?: number
    isActiveAuto?: boolean
    isDefaultEdition?: boolean
    status?: string
    lastError?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    glossaries?: TranslationGlossaryCreateNestedManyWithoutProjectInput
    chapterTranslations?: ChapterTranslationCreateNestedManyWithoutProjectInput
    runs?: TranslationRunCreateNestedManyWithoutProjectInput
  }

  export type TranslationProjectUncheckedCreateWithoutNovelInput = {
    id?: string
    name: string
    targetLanguage?: string
    provider?: string
    model?: string
    systemPrompt?: string | null
    styleGuideJson?: string
    contextMode?: string
    historyDepth?: number
    autoTranslateNewChapters?: boolean
    chapterConcurrency?: number
    isActiveAuto?: boolean
    isDefaultEdition?: boolean
    status?: string
    lastError?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    glossaries?: TranslationGlossaryUncheckedCreateNestedManyWithoutProjectInput
    chapterTranslations?: ChapterTranslationUncheckedCreateNestedManyWithoutProjectInput
    runs?: TranslationRunUncheckedCreateNestedManyWithoutProjectInput
  }

  export type TranslationProjectCreateOrConnectWithoutNovelInput = {
    where: TranslationProjectWhereUniqueInput
    create: XOR<TranslationProjectCreateWithoutNovelInput, TranslationProjectUncheckedCreateWithoutNovelInput>
  }

  export type TranslationProjectCreateManyNovelInputEnvelope = {
    data: TranslationProjectCreateManyNovelInput | TranslationProjectCreateManyNovelInput[]
  }

  export type ChapterUpsertWithWhereUniqueWithoutNovelInput = {
    where: ChapterWhereUniqueInput
    update: XOR<ChapterUpdateWithoutNovelInput, ChapterUncheckedUpdateWithoutNovelInput>
    create: XOR<ChapterCreateWithoutNovelInput, ChapterUncheckedCreateWithoutNovelInput>
  }

  export type ChapterUpdateWithWhereUniqueWithoutNovelInput = {
    where: ChapterWhereUniqueInput
    data: XOR<ChapterUpdateWithoutNovelInput, ChapterUncheckedUpdateWithoutNovelInput>
  }

  export type ChapterUpdateManyWithWhereWithoutNovelInput = {
    where: ChapterScalarWhereInput
    data: XOR<ChapterUpdateManyMutationInput, ChapterUncheckedUpdateManyWithoutNovelInput>
  }

  export type ChapterScalarWhereInput = {
    AND?: ChapterScalarWhereInput | ChapterScalarWhereInput[]
    OR?: ChapterScalarWhereInput[]
    NOT?: ChapterScalarWhereInput | ChapterScalarWhereInput[]
    id?: StringFilter<"Chapter"> | string
    novelId?: StringFilter<"Chapter"> | string
    chapterIndex?: IntFilter<"Chapter"> | number
    title?: StringFilter<"Chapter"> | string
    sourceUrl?: StringFilter<"Chapter"> | string
    status?: StringFilter<"Chapter"> | string
    epubPath?: StringNullableFilter<"Chapter"> | string | null
    fileSize?: IntNullableFilter<"Chapter"> | number | null
    checksum?: StringNullableFilter<"Chapter"> | string | null
    retryCount?: IntFilter<"Chapter"> | number
    publishedAt?: DateTimeNullableFilter<"Chapter"> | Date | string | null
    lastError?: StringNullableFilter<"Chapter"> | string | null
    createdAt?: DateTimeFilter<"Chapter"> | Date | string
    updatedAt?: DateTimeFilter<"Chapter"> | Date | string
  }

  export type SyncRunUpsertWithWhereUniqueWithoutNovelInput = {
    where: SyncRunWhereUniqueInput
    update: XOR<SyncRunUpdateWithoutNovelInput, SyncRunUncheckedUpdateWithoutNovelInput>
    create: XOR<SyncRunCreateWithoutNovelInput, SyncRunUncheckedCreateWithoutNovelInput>
  }

  export type SyncRunUpdateWithWhereUniqueWithoutNovelInput = {
    where: SyncRunWhereUniqueInput
    data: XOR<SyncRunUpdateWithoutNovelInput, SyncRunUncheckedUpdateWithoutNovelInput>
  }

  export type SyncRunUpdateManyWithWhereWithoutNovelInput = {
    where: SyncRunScalarWhereInput
    data: XOR<SyncRunUpdateManyMutationInput, SyncRunUncheckedUpdateManyWithoutNovelInput>
  }

  export type SyncRunScalarWhereInput = {
    AND?: SyncRunScalarWhereInput | SyncRunScalarWhereInput[]
    OR?: SyncRunScalarWhereInput[]
    NOT?: SyncRunScalarWhereInput | SyncRunScalarWhereInput[]
    id?: StringFilter<"SyncRun"> | string
    novelId?: StringFilter<"SyncRun"> | string
    triggerType?: StringFilter<"SyncRun"> | string
    status?: StringFilter<"SyncRun"> | string
    totalFound?: IntFilter<"SyncRun"> | number
    newChapters?: IntFilter<"SyncRun"> | number
    errorMessage?: StringNullableFilter<"SyncRun"> | string | null
    startedAt?: DateTimeNullableFilter<"SyncRun"> | Date | string | null
    endedAt?: DateTimeNullableFilter<"SyncRun"> | Date | string | null
    createdAt?: DateTimeFilter<"SyncRun"> | Date | string
  }

  export type TranslationProjectUpsertWithWhereUniqueWithoutNovelInput = {
    where: TranslationProjectWhereUniqueInput
    update: XOR<TranslationProjectUpdateWithoutNovelInput, TranslationProjectUncheckedUpdateWithoutNovelInput>
    create: XOR<TranslationProjectCreateWithoutNovelInput, TranslationProjectUncheckedCreateWithoutNovelInput>
  }

  export type TranslationProjectUpdateWithWhereUniqueWithoutNovelInput = {
    where: TranslationProjectWhereUniqueInput
    data: XOR<TranslationProjectUpdateWithoutNovelInput, TranslationProjectUncheckedUpdateWithoutNovelInput>
  }

  export type TranslationProjectUpdateManyWithWhereWithoutNovelInput = {
    where: TranslationProjectScalarWhereInput
    data: XOR<TranslationProjectUpdateManyMutationInput, TranslationProjectUncheckedUpdateManyWithoutNovelInput>
  }

  export type TranslationProjectScalarWhereInput = {
    AND?: TranslationProjectScalarWhereInput | TranslationProjectScalarWhereInput[]
    OR?: TranslationProjectScalarWhereInput[]
    NOT?: TranslationProjectScalarWhereInput | TranslationProjectScalarWhereInput[]
    id?: StringFilter<"TranslationProject"> | string
    novelId?: StringFilter<"TranslationProject"> | string
    name?: StringFilter<"TranslationProject"> | string
    targetLanguage?: StringFilter<"TranslationProject"> | string
    provider?: StringFilter<"TranslationProject"> | string
    model?: StringFilter<"TranslationProject"> | string
    systemPrompt?: StringNullableFilter<"TranslationProject"> | string | null
    styleGuideJson?: StringFilter<"TranslationProject"> | string
    contextMode?: StringFilter<"TranslationProject"> | string
    historyDepth?: IntFilter<"TranslationProject"> | number
    autoTranslateNewChapters?: BoolFilter<"TranslationProject"> | boolean
    chapterConcurrency?: IntFilter<"TranslationProject"> | number
    isActiveAuto?: BoolFilter<"TranslationProject"> | boolean
    isDefaultEdition?: BoolFilter<"TranslationProject"> | boolean
    status?: StringFilter<"TranslationProject"> | string
    lastError?: StringNullableFilter<"TranslationProject"> | string | null
    createdAt?: DateTimeFilter<"TranslationProject"> | Date | string
    updatedAt?: DateTimeFilter<"TranslationProject"> | Date | string
  }

  export type NovelCreateWithoutChaptersInput = {
    id?: string
    title: string
    author?: string | null
    sourceId: string
    sourceName?: string | null
    sourceUrl: string
    coverUrl?: string | null
    coverLocalPath?: string | null
    description?: string | null
    status?: string
    syncStatus?: string
    totalChapters?: number
    downloadedChapters?: number
    defaultEditionKind?: string
    defaultTranslationProjectId?: string | null
    lastCheckedAt?: Date | string | null
    lastSyncStartedAt?: Date | string | null
    lastSyncEndedAt?: Date | string | null
    lastError?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    syncRuns?: SyncRunCreateNestedManyWithoutNovelInput
    translationProjects?: TranslationProjectCreateNestedManyWithoutNovelInput
  }

  export type NovelUncheckedCreateWithoutChaptersInput = {
    id?: string
    title: string
    author?: string | null
    sourceId: string
    sourceName?: string | null
    sourceUrl: string
    coverUrl?: string | null
    coverLocalPath?: string | null
    description?: string | null
    status?: string
    syncStatus?: string
    totalChapters?: number
    downloadedChapters?: number
    defaultEditionKind?: string
    defaultTranslationProjectId?: string | null
    lastCheckedAt?: Date | string | null
    lastSyncStartedAt?: Date | string | null
    lastSyncEndedAt?: Date | string | null
    lastError?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    syncRuns?: SyncRunUncheckedCreateNestedManyWithoutNovelInput
    translationProjects?: TranslationProjectUncheckedCreateNestedManyWithoutNovelInput
  }

  export type NovelCreateOrConnectWithoutChaptersInput = {
    where: NovelWhereUniqueInput
    create: XOR<NovelCreateWithoutChaptersInput, NovelUncheckedCreateWithoutChaptersInput>
  }

  export type ChapterTranslationCreateWithoutChapterInput = {
    id?: string
    sourceChecksum: string
    status?: string
    currentPublishedVersionId?: string | null
    latestGeneratedVersionId?: string | null
    hasManualEdits?: boolean
    newGeneratedAvailable?: boolean
    staleReason?: string | null
    lastError?: string | null
    retryCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    project: TranslationProjectCreateNestedOneWithoutChapterTranslationsInput
    versions?: ChapterTranslationVersionCreateNestedManyWithoutChapterTranslationInput
  }

  export type ChapterTranslationUncheckedCreateWithoutChapterInput = {
    id?: string
    projectId: string
    sourceChecksum: string
    status?: string
    currentPublishedVersionId?: string | null
    latestGeneratedVersionId?: string | null
    hasManualEdits?: boolean
    newGeneratedAvailable?: boolean
    staleReason?: string | null
    lastError?: string | null
    retryCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    versions?: ChapterTranslationVersionUncheckedCreateNestedManyWithoutChapterTranslationInput
  }

  export type ChapterTranslationCreateOrConnectWithoutChapterInput = {
    where: ChapterTranslationWhereUniqueInput
    create: XOR<ChapterTranslationCreateWithoutChapterInput, ChapterTranslationUncheckedCreateWithoutChapterInput>
  }

  export type ChapterTranslationCreateManyChapterInputEnvelope = {
    data: ChapterTranslationCreateManyChapterInput | ChapterTranslationCreateManyChapterInput[]
  }

  export type NovelUpsertWithoutChaptersInput = {
    update: XOR<NovelUpdateWithoutChaptersInput, NovelUncheckedUpdateWithoutChaptersInput>
    create: XOR<NovelCreateWithoutChaptersInput, NovelUncheckedCreateWithoutChaptersInput>
    where?: NovelWhereInput
  }

  export type NovelUpdateToOneWithWhereWithoutChaptersInput = {
    where?: NovelWhereInput
    data: XOR<NovelUpdateWithoutChaptersInput, NovelUncheckedUpdateWithoutChaptersInput>
  }

  export type NovelUpdateWithoutChaptersInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    author?: NullableStringFieldUpdateOperationsInput | string | null
    sourceId?: StringFieldUpdateOperationsInput | string
    sourceName?: NullableStringFieldUpdateOperationsInput | string | null
    sourceUrl?: StringFieldUpdateOperationsInput | string
    coverUrl?: NullableStringFieldUpdateOperationsInput | string | null
    coverLocalPath?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    syncStatus?: StringFieldUpdateOperationsInput | string
    totalChapters?: IntFieldUpdateOperationsInput | number
    downloadedChapters?: IntFieldUpdateOperationsInput | number
    defaultEditionKind?: StringFieldUpdateOperationsInput | string
    defaultTranslationProjectId?: NullableStringFieldUpdateOperationsInput | string | null
    lastCheckedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastSyncStartedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastSyncEndedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    syncRuns?: SyncRunUpdateManyWithoutNovelNestedInput
    translationProjects?: TranslationProjectUpdateManyWithoutNovelNestedInput
  }

  export type NovelUncheckedUpdateWithoutChaptersInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    author?: NullableStringFieldUpdateOperationsInput | string | null
    sourceId?: StringFieldUpdateOperationsInput | string
    sourceName?: NullableStringFieldUpdateOperationsInput | string | null
    sourceUrl?: StringFieldUpdateOperationsInput | string
    coverUrl?: NullableStringFieldUpdateOperationsInput | string | null
    coverLocalPath?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    syncStatus?: StringFieldUpdateOperationsInput | string
    totalChapters?: IntFieldUpdateOperationsInput | number
    downloadedChapters?: IntFieldUpdateOperationsInput | number
    defaultEditionKind?: StringFieldUpdateOperationsInput | string
    defaultTranslationProjectId?: NullableStringFieldUpdateOperationsInput | string | null
    lastCheckedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastSyncStartedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastSyncEndedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    syncRuns?: SyncRunUncheckedUpdateManyWithoutNovelNestedInput
    translationProjects?: TranslationProjectUncheckedUpdateManyWithoutNovelNestedInput
  }

  export type ChapterTranslationUpsertWithWhereUniqueWithoutChapterInput = {
    where: ChapterTranslationWhereUniqueInput
    update: XOR<ChapterTranslationUpdateWithoutChapterInput, ChapterTranslationUncheckedUpdateWithoutChapterInput>
    create: XOR<ChapterTranslationCreateWithoutChapterInput, ChapterTranslationUncheckedCreateWithoutChapterInput>
  }

  export type ChapterTranslationUpdateWithWhereUniqueWithoutChapterInput = {
    where: ChapterTranslationWhereUniqueInput
    data: XOR<ChapterTranslationUpdateWithoutChapterInput, ChapterTranslationUncheckedUpdateWithoutChapterInput>
  }

  export type ChapterTranslationUpdateManyWithWhereWithoutChapterInput = {
    where: ChapterTranslationScalarWhereInput
    data: XOR<ChapterTranslationUpdateManyMutationInput, ChapterTranslationUncheckedUpdateManyWithoutChapterInput>
  }

  export type ChapterTranslationScalarWhereInput = {
    AND?: ChapterTranslationScalarWhereInput | ChapterTranslationScalarWhereInput[]
    OR?: ChapterTranslationScalarWhereInput[]
    NOT?: ChapterTranslationScalarWhereInput | ChapterTranslationScalarWhereInput[]
    id?: StringFilter<"ChapterTranslation"> | string
    projectId?: StringFilter<"ChapterTranslation"> | string
    chapterId?: StringFilter<"ChapterTranslation"> | string
    sourceChecksum?: StringFilter<"ChapterTranslation"> | string
    status?: StringFilter<"ChapterTranslation"> | string
    currentPublishedVersionId?: StringNullableFilter<"ChapterTranslation"> | string | null
    latestGeneratedVersionId?: StringNullableFilter<"ChapterTranslation"> | string | null
    hasManualEdits?: BoolFilter<"ChapterTranslation"> | boolean
    newGeneratedAvailable?: BoolFilter<"ChapterTranslation"> | boolean
    staleReason?: StringNullableFilter<"ChapterTranslation"> | string | null
    lastError?: StringNullableFilter<"ChapterTranslation"> | string | null
    retryCount?: IntFilter<"ChapterTranslation"> | number
    createdAt?: DateTimeFilter<"ChapterTranslation"> | Date | string
    updatedAt?: DateTimeFilter<"ChapterTranslation"> | Date | string
  }

  export type NovelCreateWithoutSyncRunsInput = {
    id?: string
    title: string
    author?: string | null
    sourceId: string
    sourceName?: string | null
    sourceUrl: string
    coverUrl?: string | null
    coverLocalPath?: string | null
    description?: string | null
    status?: string
    syncStatus?: string
    totalChapters?: number
    downloadedChapters?: number
    defaultEditionKind?: string
    defaultTranslationProjectId?: string | null
    lastCheckedAt?: Date | string | null
    lastSyncStartedAt?: Date | string | null
    lastSyncEndedAt?: Date | string | null
    lastError?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    chapters?: ChapterCreateNestedManyWithoutNovelInput
    translationProjects?: TranslationProjectCreateNestedManyWithoutNovelInput
  }

  export type NovelUncheckedCreateWithoutSyncRunsInput = {
    id?: string
    title: string
    author?: string | null
    sourceId: string
    sourceName?: string | null
    sourceUrl: string
    coverUrl?: string | null
    coverLocalPath?: string | null
    description?: string | null
    status?: string
    syncStatus?: string
    totalChapters?: number
    downloadedChapters?: number
    defaultEditionKind?: string
    defaultTranslationProjectId?: string | null
    lastCheckedAt?: Date | string | null
    lastSyncStartedAt?: Date | string | null
    lastSyncEndedAt?: Date | string | null
    lastError?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    chapters?: ChapterUncheckedCreateNestedManyWithoutNovelInput
    translationProjects?: TranslationProjectUncheckedCreateNestedManyWithoutNovelInput
  }

  export type NovelCreateOrConnectWithoutSyncRunsInput = {
    where: NovelWhereUniqueInput
    create: XOR<NovelCreateWithoutSyncRunsInput, NovelUncheckedCreateWithoutSyncRunsInput>
  }

  export type NovelUpsertWithoutSyncRunsInput = {
    update: XOR<NovelUpdateWithoutSyncRunsInput, NovelUncheckedUpdateWithoutSyncRunsInput>
    create: XOR<NovelCreateWithoutSyncRunsInput, NovelUncheckedCreateWithoutSyncRunsInput>
    where?: NovelWhereInput
  }

  export type NovelUpdateToOneWithWhereWithoutSyncRunsInput = {
    where?: NovelWhereInput
    data: XOR<NovelUpdateWithoutSyncRunsInput, NovelUncheckedUpdateWithoutSyncRunsInput>
  }

  export type NovelUpdateWithoutSyncRunsInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    author?: NullableStringFieldUpdateOperationsInput | string | null
    sourceId?: StringFieldUpdateOperationsInput | string
    sourceName?: NullableStringFieldUpdateOperationsInput | string | null
    sourceUrl?: StringFieldUpdateOperationsInput | string
    coverUrl?: NullableStringFieldUpdateOperationsInput | string | null
    coverLocalPath?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    syncStatus?: StringFieldUpdateOperationsInput | string
    totalChapters?: IntFieldUpdateOperationsInput | number
    downloadedChapters?: IntFieldUpdateOperationsInput | number
    defaultEditionKind?: StringFieldUpdateOperationsInput | string
    defaultTranslationProjectId?: NullableStringFieldUpdateOperationsInput | string | null
    lastCheckedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastSyncStartedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastSyncEndedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    chapters?: ChapterUpdateManyWithoutNovelNestedInput
    translationProjects?: TranslationProjectUpdateManyWithoutNovelNestedInput
  }

  export type NovelUncheckedUpdateWithoutSyncRunsInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    author?: NullableStringFieldUpdateOperationsInput | string | null
    sourceId?: StringFieldUpdateOperationsInput | string
    sourceName?: NullableStringFieldUpdateOperationsInput | string | null
    sourceUrl?: StringFieldUpdateOperationsInput | string
    coverUrl?: NullableStringFieldUpdateOperationsInput | string | null
    coverLocalPath?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    syncStatus?: StringFieldUpdateOperationsInput | string
    totalChapters?: IntFieldUpdateOperationsInput | number
    downloadedChapters?: IntFieldUpdateOperationsInput | number
    defaultEditionKind?: StringFieldUpdateOperationsInput | string
    defaultTranslationProjectId?: NullableStringFieldUpdateOperationsInput | string | null
    lastCheckedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastSyncStartedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastSyncEndedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    chapters?: ChapterUncheckedUpdateManyWithoutNovelNestedInput
    translationProjects?: TranslationProjectUncheckedUpdateManyWithoutNovelNestedInput
  }

  export type NovelCreateWithoutTranslationProjectsInput = {
    id?: string
    title: string
    author?: string | null
    sourceId: string
    sourceName?: string | null
    sourceUrl: string
    coverUrl?: string | null
    coverLocalPath?: string | null
    description?: string | null
    status?: string
    syncStatus?: string
    totalChapters?: number
    downloadedChapters?: number
    defaultEditionKind?: string
    defaultTranslationProjectId?: string | null
    lastCheckedAt?: Date | string | null
    lastSyncStartedAt?: Date | string | null
    lastSyncEndedAt?: Date | string | null
    lastError?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    chapters?: ChapterCreateNestedManyWithoutNovelInput
    syncRuns?: SyncRunCreateNestedManyWithoutNovelInput
  }

  export type NovelUncheckedCreateWithoutTranslationProjectsInput = {
    id?: string
    title: string
    author?: string | null
    sourceId: string
    sourceName?: string | null
    sourceUrl: string
    coverUrl?: string | null
    coverLocalPath?: string | null
    description?: string | null
    status?: string
    syncStatus?: string
    totalChapters?: number
    downloadedChapters?: number
    defaultEditionKind?: string
    defaultTranslationProjectId?: string | null
    lastCheckedAt?: Date | string | null
    lastSyncStartedAt?: Date | string | null
    lastSyncEndedAt?: Date | string | null
    lastError?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    chapters?: ChapterUncheckedCreateNestedManyWithoutNovelInput
    syncRuns?: SyncRunUncheckedCreateNestedManyWithoutNovelInput
  }

  export type NovelCreateOrConnectWithoutTranslationProjectsInput = {
    where: NovelWhereUniqueInput
    create: XOR<NovelCreateWithoutTranslationProjectsInput, NovelUncheckedCreateWithoutTranslationProjectsInput>
  }

  export type TranslationGlossaryCreateWithoutProjectInput = {
    id?: string
    version: number
    sourceType?: string
    rawPayload?: string
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    entries?: TranslationGlossaryEntryCreateNestedManyWithoutGlossaryInput
  }

  export type TranslationGlossaryUncheckedCreateWithoutProjectInput = {
    id?: string
    version: number
    sourceType?: string
    rawPayload?: string
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    entries?: TranslationGlossaryEntryUncheckedCreateNestedManyWithoutGlossaryInput
  }

  export type TranslationGlossaryCreateOrConnectWithoutProjectInput = {
    where: TranslationGlossaryWhereUniqueInput
    create: XOR<TranslationGlossaryCreateWithoutProjectInput, TranslationGlossaryUncheckedCreateWithoutProjectInput>
  }

  export type TranslationGlossaryCreateManyProjectInputEnvelope = {
    data: TranslationGlossaryCreateManyProjectInput | TranslationGlossaryCreateManyProjectInput[]
  }

  export type ChapterTranslationCreateWithoutProjectInput = {
    id?: string
    sourceChecksum: string
    status?: string
    currentPublishedVersionId?: string | null
    latestGeneratedVersionId?: string | null
    hasManualEdits?: boolean
    newGeneratedAvailable?: boolean
    staleReason?: string | null
    lastError?: string | null
    retryCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    chapter: ChapterCreateNestedOneWithoutTranslationsInput
    versions?: ChapterTranslationVersionCreateNestedManyWithoutChapterTranslationInput
  }

  export type ChapterTranslationUncheckedCreateWithoutProjectInput = {
    id?: string
    chapterId: string
    sourceChecksum: string
    status?: string
    currentPublishedVersionId?: string | null
    latestGeneratedVersionId?: string | null
    hasManualEdits?: boolean
    newGeneratedAvailable?: boolean
    staleReason?: string | null
    lastError?: string | null
    retryCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    versions?: ChapterTranslationVersionUncheckedCreateNestedManyWithoutChapterTranslationInput
  }

  export type ChapterTranslationCreateOrConnectWithoutProjectInput = {
    where: ChapterTranslationWhereUniqueInput
    create: XOR<ChapterTranslationCreateWithoutProjectInput, ChapterTranslationUncheckedCreateWithoutProjectInput>
  }

  export type ChapterTranslationCreateManyProjectInputEnvelope = {
    data: ChapterTranslationCreateManyProjectInput | ChapterTranslationCreateManyProjectInput[]
  }

  export type TranslationRunCreateWithoutProjectInput = {
    id?: string
    triggerType: string
    scope?: string
    status?: string
    queuedCount?: number
    completedCount?: number
    failedCount?: number
    tokenUsage?: number
    estimatedCost?: number
    errorMessage?: string | null
    startedAt?: Date | string | null
    endedAt?: Date | string | null
    createdAt?: Date | string
  }

  export type TranslationRunUncheckedCreateWithoutProjectInput = {
    id?: string
    triggerType: string
    scope?: string
    status?: string
    queuedCount?: number
    completedCount?: number
    failedCount?: number
    tokenUsage?: number
    estimatedCost?: number
    errorMessage?: string | null
    startedAt?: Date | string | null
    endedAt?: Date | string | null
    createdAt?: Date | string
  }

  export type TranslationRunCreateOrConnectWithoutProjectInput = {
    where: TranslationRunWhereUniqueInput
    create: XOR<TranslationRunCreateWithoutProjectInput, TranslationRunUncheckedCreateWithoutProjectInput>
  }

  export type TranslationRunCreateManyProjectInputEnvelope = {
    data: TranslationRunCreateManyProjectInput | TranslationRunCreateManyProjectInput[]
  }

  export type NovelUpsertWithoutTranslationProjectsInput = {
    update: XOR<NovelUpdateWithoutTranslationProjectsInput, NovelUncheckedUpdateWithoutTranslationProjectsInput>
    create: XOR<NovelCreateWithoutTranslationProjectsInput, NovelUncheckedCreateWithoutTranslationProjectsInput>
    where?: NovelWhereInput
  }

  export type NovelUpdateToOneWithWhereWithoutTranslationProjectsInput = {
    where?: NovelWhereInput
    data: XOR<NovelUpdateWithoutTranslationProjectsInput, NovelUncheckedUpdateWithoutTranslationProjectsInput>
  }

  export type NovelUpdateWithoutTranslationProjectsInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    author?: NullableStringFieldUpdateOperationsInput | string | null
    sourceId?: StringFieldUpdateOperationsInput | string
    sourceName?: NullableStringFieldUpdateOperationsInput | string | null
    sourceUrl?: StringFieldUpdateOperationsInput | string
    coverUrl?: NullableStringFieldUpdateOperationsInput | string | null
    coverLocalPath?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    syncStatus?: StringFieldUpdateOperationsInput | string
    totalChapters?: IntFieldUpdateOperationsInput | number
    downloadedChapters?: IntFieldUpdateOperationsInput | number
    defaultEditionKind?: StringFieldUpdateOperationsInput | string
    defaultTranslationProjectId?: NullableStringFieldUpdateOperationsInput | string | null
    lastCheckedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastSyncStartedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastSyncEndedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    chapters?: ChapterUpdateManyWithoutNovelNestedInput
    syncRuns?: SyncRunUpdateManyWithoutNovelNestedInput
  }

  export type NovelUncheckedUpdateWithoutTranslationProjectsInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    author?: NullableStringFieldUpdateOperationsInput | string | null
    sourceId?: StringFieldUpdateOperationsInput | string
    sourceName?: NullableStringFieldUpdateOperationsInput | string | null
    sourceUrl?: StringFieldUpdateOperationsInput | string
    coverUrl?: NullableStringFieldUpdateOperationsInput | string | null
    coverLocalPath?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    syncStatus?: StringFieldUpdateOperationsInput | string
    totalChapters?: IntFieldUpdateOperationsInput | number
    downloadedChapters?: IntFieldUpdateOperationsInput | number
    defaultEditionKind?: StringFieldUpdateOperationsInput | string
    defaultTranslationProjectId?: NullableStringFieldUpdateOperationsInput | string | null
    lastCheckedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastSyncStartedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastSyncEndedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    chapters?: ChapterUncheckedUpdateManyWithoutNovelNestedInput
    syncRuns?: SyncRunUncheckedUpdateManyWithoutNovelNestedInput
  }

  export type TranslationGlossaryUpsertWithWhereUniqueWithoutProjectInput = {
    where: TranslationGlossaryWhereUniqueInput
    update: XOR<TranslationGlossaryUpdateWithoutProjectInput, TranslationGlossaryUncheckedUpdateWithoutProjectInput>
    create: XOR<TranslationGlossaryCreateWithoutProjectInput, TranslationGlossaryUncheckedCreateWithoutProjectInput>
  }

  export type TranslationGlossaryUpdateWithWhereUniqueWithoutProjectInput = {
    where: TranslationGlossaryWhereUniqueInput
    data: XOR<TranslationGlossaryUpdateWithoutProjectInput, TranslationGlossaryUncheckedUpdateWithoutProjectInput>
  }

  export type TranslationGlossaryUpdateManyWithWhereWithoutProjectInput = {
    where: TranslationGlossaryScalarWhereInput
    data: XOR<TranslationGlossaryUpdateManyMutationInput, TranslationGlossaryUncheckedUpdateManyWithoutProjectInput>
  }

  export type TranslationGlossaryScalarWhereInput = {
    AND?: TranslationGlossaryScalarWhereInput | TranslationGlossaryScalarWhereInput[]
    OR?: TranslationGlossaryScalarWhereInput[]
    NOT?: TranslationGlossaryScalarWhereInput | TranslationGlossaryScalarWhereInput[]
    id?: StringFilter<"TranslationGlossary"> | string
    projectId?: StringFilter<"TranslationGlossary"> | string
    version?: IntFilter<"TranslationGlossary"> | number
    sourceType?: StringFilter<"TranslationGlossary"> | string
    rawPayload?: StringFilter<"TranslationGlossary"> | string
    isActive?: BoolFilter<"TranslationGlossary"> | boolean
    createdAt?: DateTimeFilter<"TranslationGlossary"> | Date | string
    updatedAt?: DateTimeFilter<"TranslationGlossary"> | Date | string
  }

  export type ChapterTranslationUpsertWithWhereUniqueWithoutProjectInput = {
    where: ChapterTranslationWhereUniqueInput
    update: XOR<ChapterTranslationUpdateWithoutProjectInput, ChapterTranslationUncheckedUpdateWithoutProjectInput>
    create: XOR<ChapterTranslationCreateWithoutProjectInput, ChapterTranslationUncheckedCreateWithoutProjectInput>
  }

  export type ChapterTranslationUpdateWithWhereUniqueWithoutProjectInput = {
    where: ChapterTranslationWhereUniqueInput
    data: XOR<ChapterTranslationUpdateWithoutProjectInput, ChapterTranslationUncheckedUpdateWithoutProjectInput>
  }

  export type ChapterTranslationUpdateManyWithWhereWithoutProjectInput = {
    where: ChapterTranslationScalarWhereInput
    data: XOR<ChapterTranslationUpdateManyMutationInput, ChapterTranslationUncheckedUpdateManyWithoutProjectInput>
  }

  export type TranslationRunUpsertWithWhereUniqueWithoutProjectInput = {
    where: TranslationRunWhereUniqueInput
    update: XOR<TranslationRunUpdateWithoutProjectInput, TranslationRunUncheckedUpdateWithoutProjectInput>
    create: XOR<TranslationRunCreateWithoutProjectInput, TranslationRunUncheckedCreateWithoutProjectInput>
  }

  export type TranslationRunUpdateWithWhereUniqueWithoutProjectInput = {
    where: TranslationRunWhereUniqueInput
    data: XOR<TranslationRunUpdateWithoutProjectInput, TranslationRunUncheckedUpdateWithoutProjectInput>
  }

  export type TranslationRunUpdateManyWithWhereWithoutProjectInput = {
    where: TranslationRunScalarWhereInput
    data: XOR<TranslationRunUpdateManyMutationInput, TranslationRunUncheckedUpdateManyWithoutProjectInput>
  }

  export type TranslationRunScalarWhereInput = {
    AND?: TranslationRunScalarWhereInput | TranslationRunScalarWhereInput[]
    OR?: TranslationRunScalarWhereInput[]
    NOT?: TranslationRunScalarWhereInput | TranslationRunScalarWhereInput[]
    id?: StringFilter<"TranslationRun"> | string
    projectId?: StringFilter<"TranslationRun"> | string
    triggerType?: StringFilter<"TranslationRun"> | string
    scope?: StringFilter<"TranslationRun"> | string
    status?: StringFilter<"TranslationRun"> | string
    queuedCount?: IntFilter<"TranslationRun"> | number
    completedCount?: IntFilter<"TranslationRun"> | number
    failedCount?: IntFilter<"TranslationRun"> | number
    tokenUsage?: IntFilter<"TranslationRun"> | number
    estimatedCost?: FloatFilter<"TranslationRun"> | number
    errorMessage?: StringNullableFilter<"TranslationRun"> | string | null
    startedAt?: DateTimeNullableFilter<"TranslationRun"> | Date | string | null
    endedAt?: DateTimeNullableFilter<"TranslationRun"> | Date | string | null
    createdAt?: DateTimeFilter<"TranslationRun"> | Date | string
  }

  export type TranslationProjectCreateWithoutGlossariesInput = {
    id?: string
    name: string
    targetLanguage?: string
    provider?: string
    model?: string
    systemPrompt?: string | null
    styleGuideJson?: string
    contextMode?: string
    historyDepth?: number
    autoTranslateNewChapters?: boolean
    chapterConcurrency?: number
    isActiveAuto?: boolean
    isDefaultEdition?: boolean
    status?: string
    lastError?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    novel: NovelCreateNestedOneWithoutTranslationProjectsInput
    chapterTranslations?: ChapterTranslationCreateNestedManyWithoutProjectInput
    runs?: TranslationRunCreateNestedManyWithoutProjectInput
  }

  export type TranslationProjectUncheckedCreateWithoutGlossariesInput = {
    id?: string
    novelId: string
    name: string
    targetLanguage?: string
    provider?: string
    model?: string
    systemPrompt?: string | null
    styleGuideJson?: string
    contextMode?: string
    historyDepth?: number
    autoTranslateNewChapters?: boolean
    chapterConcurrency?: number
    isActiveAuto?: boolean
    isDefaultEdition?: boolean
    status?: string
    lastError?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    chapterTranslations?: ChapterTranslationUncheckedCreateNestedManyWithoutProjectInput
    runs?: TranslationRunUncheckedCreateNestedManyWithoutProjectInput
  }

  export type TranslationProjectCreateOrConnectWithoutGlossariesInput = {
    where: TranslationProjectWhereUniqueInput
    create: XOR<TranslationProjectCreateWithoutGlossariesInput, TranslationProjectUncheckedCreateWithoutGlossariesInput>
  }

  export type TranslationGlossaryEntryCreateWithoutGlossaryInput = {
    id?: string
    type?: string
    rawName: string
    translatedName: string
    viLabel?: string | null
    gender?: string | null
    description?: string | null
    aliasesJson?: string
    notes?: string | null
    locked?: boolean
    priority?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TranslationGlossaryEntryUncheckedCreateWithoutGlossaryInput = {
    id?: string
    type?: string
    rawName: string
    translatedName: string
    viLabel?: string | null
    gender?: string | null
    description?: string | null
    aliasesJson?: string
    notes?: string | null
    locked?: boolean
    priority?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TranslationGlossaryEntryCreateOrConnectWithoutGlossaryInput = {
    where: TranslationGlossaryEntryWhereUniqueInput
    create: XOR<TranslationGlossaryEntryCreateWithoutGlossaryInput, TranslationGlossaryEntryUncheckedCreateWithoutGlossaryInput>
  }

  export type TranslationGlossaryEntryCreateManyGlossaryInputEnvelope = {
    data: TranslationGlossaryEntryCreateManyGlossaryInput | TranslationGlossaryEntryCreateManyGlossaryInput[]
  }

  export type TranslationProjectUpsertWithoutGlossariesInput = {
    update: XOR<TranslationProjectUpdateWithoutGlossariesInput, TranslationProjectUncheckedUpdateWithoutGlossariesInput>
    create: XOR<TranslationProjectCreateWithoutGlossariesInput, TranslationProjectUncheckedCreateWithoutGlossariesInput>
    where?: TranslationProjectWhereInput
  }

  export type TranslationProjectUpdateToOneWithWhereWithoutGlossariesInput = {
    where?: TranslationProjectWhereInput
    data: XOR<TranslationProjectUpdateWithoutGlossariesInput, TranslationProjectUncheckedUpdateWithoutGlossariesInput>
  }

  export type TranslationProjectUpdateWithoutGlossariesInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    targetLanguage?: StringFieldUpdateOperationsInput | string
    provider?: StringFieldUpdateOperationsInput | string
    model?: StringFieldUpdateOperationsInput | string
    systemPrompt?: NullableStringFieldUpdateOperationsInput | string | null
    styleGuideJson?: StringFieldUpdateOperationsInput | string
    contextMode?: StringFieldUpdateOperationsInput | string
    historyDepth?: IntFieldUpdateOperationsInput | number
    autoTranslateNewChapters?: BoolFieldUpdateOperationsInput | boolean
    chapterConcurrency?: IntFieldUpdateOperationsInput | number
    isActiveAuto?: BoolFieldUpdateOperationsInput | boolean
    isDefaultEdition?: BoolFieldUpdateOperationsInput | boolean
    status?: StringFieldUpdateOperationsInput | string
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    novel?: NovelUpdateOneRequiredWithoutTranslationProjectsNestedInput
    chapterTranslations?: ChapterTranslationUpdateManyWithoutProjectNestedInput
    runs?: TranslationRunUpdateManyWithoutProjectNestedInput
  }

  export type TranslationProjectUncheckedUpdateWithoutGlossariesInput = {
    id?: StringFieldUpdateOperationsInput | string
    novelId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    targetLanguage?: StringFieldUpdateOperationsInput | string
    provider?: StringFieldUpdateOperationsInput | string
    model?: StringFieldUpdateOperationsInput | string
    systemPrompt?: NullableStringFieldUpdateOperationsInput | string | null
    styleGuideJson?: StringFieldUpdateOperationsInput | string
    contextMode?: StringFieldUpdateOperationsInput | string
    historyDepth?: IntFieldUpdateOperationsInput | number
    autoTranslateNewChapters?: BoolFieldUpdateOperationsInput | boolean
    chapterConcurrency?: IntFieldUpdateOperationsInput | number
    isActiveAuto?: BoolFieldUpdateOperationsInput | boolean
    isDefaultEdition?: BoolFieldUpdateOperationsInput | boolean
    status?: StringFieldUpdateOperationsInput | string
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    chapterTranslations?: ChapterTranslationUncheckedUpdateManyWithoutProjectNestedInput
    runs?: TranslationRunUncheckedUpdateManyWithoutProjectNestedInput
  }

  export type TranslationGlossaryEntryUpsertWithWhereUniqueWithoutGlossaryInput = {
    where: TranslationGlossaryEntryWhereUniqueInput
    update: XOR<TranslationGlossaryEntryUpdateWithoutGlossaryInput, TranslationGlossaryEntryUncheckedUpdateWithoutGlossaryInput>
    create: XOR<TranslationGlossaryEntryCreateWithoutGlossaryInput, TranslationGlossaryEntryUncheckedCreateWithoutGlossaryInput>
  }

  export type TranslationGlossaryEntryUpdateWithWhereUniqueWithoutGlossaryInput = {
    where: TranslationGlossaryEntryWhereUniqueInput
    data: XOR<TranslationGlossaryEntryUpdateWithoutGlossaryInput, TranslationGlossaryEntryUncheckedUpdateWithoutGlossaryInput>
  }

  export type TranslationGlossaryEntryUpdateManyWithWhereWithoutGlossaryInput = {
    where: TranslationGlossaryEntryScalarWhereInput
    data: XOR<TranslationGlossaryEntryUpdateManyMutationInput, TranslationGlossaryEntryUncheckedUpdateManyWithoutGlossaryInput>
  }

  export type TranslationGlossaryEntryScalarWhereInput = {
    AND?: TranslationGlossaryEntryScalarWhereInput | TranslationGlossaryEntryScalarWhereInput[]
    OR?: TranslationGlossaryEntryScalarWhereInput[]
    NOT?: TranslationGlossaryEntryScalarWhereInput | TranslationGlossaryEntryScalarWhereInput[]
    id?: StringFilter<"TranslationGlossaryEntry"> | string
    glossaryId?: StringFilter<"TranslationGlossaryEntry"> | string
    type?: StringFilter<"TranslationGlossaryEntry"> | string
    rawName?: StringFilter<"TranslationGlossaryEntry"> | string
    translatedName?: StringFilter<"TranslationGlossaryEntry"> | string
    viLabel?: StringNullableFilter<"TranslationGlossaryEntry"> | string | null
    gender?: StringNullableFilter<"TranslationGlossaryEntry"> | string | null
    description?: StringNullableFilter<"TranslationGlossaryEntry"> | string | null
    aliasesJson?: StringFilter<"TranslationGlossaryEntry"> | string
    notes?: StringNullableFilter<"TranslationGlossaryEntry"> | string | null
    locked?: BoolFilter<"TranslationGlossaryEntry"> | boolean
    priority?: IntFilter<"TranslationGlossaryEntry"> | number
    createdAt?: DateTimeFilter<"TranslationGlossaryEntry"> | Date | string
    updatedAt?: DateTimeFilter<"TranslationGlossaryEntry"> | Date | string
  }

  export type TranslationGlossaryCreateWithoutEntriesInput = {
    id?: string
    version: number
    sourceType?: string
    rawPayload?: string
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    project: TranslationProjectCreateNestedOneWithoutGlossariesInput
  }

  export type TranslationGlossaryUncheckedCreateWithoutEntriesInput = {
    id?: string
    projectId: string
    version: number
    sourceType?: string
    rawPayload?: string
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TranslationGlossaryCreateOrConnectWithoutEntriesInput = {
    where: TranslationGlossaryWhereUniqueInput
    create: XOR<TranslationGlossaryCreateWithoutEntriesInput, TranslationGlossaryUncheckedCreateWithoutEntriesInput>
  }

  export type TranslationGlossaryUpsertWithoutEntriesInput = {
    update: XOR<TranslationGlossaryUpdateWithoutEntriesInput, TranslationGlossaryUncheckedUpdateWithoutEntriesInput>
    create: XOR<TranslationGlossaryCreateWithoutEntriesInput, TranslationGlossaryUncheckedCreateWithoutEntriesInput>
    where?: TranslationGlossaryWhereInput
  }

  export type TranslationGlossaryUpdateToOneWithWhereWithoutEntriesInput = {
    where?: TranslationGlossaryWhereInput
    data: XOR<TranslationGlossaryUpdateWithoutEntriesInput, TranslationGlossaryUncheckedUpdateWithoutEntriesInput>
  }

  export type TranslationGlossaryUpdateWithoutEntriesInput = {
    id?: StringFieldUpdateOperationsInput | string
    version?: IntFieldUpdateOperationsInput | number
    sourceType?: StringFieldUpdateOperationsInput | string
    rawPayload?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    project?: TranslationProjectUpdateOneRequiredWithoutGlossariesNestedInput
  }

  export type TranslationGlossaryUncheckedUpdateWithoutEntriesInput = {
    id?: StringFieldUpdateOperationsInput | string
    projectId?: StringFieldUpdateOperationsInput | string
    version?: IntFieldUpdateOperationsInput | number
    sourceType?: StringFieldUpdateOperationsInput | string
    rawPayload?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TranslationProjectCreateWithoutChapterTranslationsInput = {
    id?: string
    name: string
    targetLanguage?: string
    provider?: string
    model?: string
    systemPrompt?: string | null
    styleGuideJson?: string
    contextMode?: string
    historyDepth?: number
    autoTranslateNewChapters?: boolean
    chapterConcurrency?: number
    isActiveAuto?: boolean
    isDefaultEdition?: boolean
    status?: string
    lastError?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    novel: NovelCreateNestedOneWithoutTranslationProjectsInput
    glossaries?: TranslationGlossaryCreateNestedManyWithoutProjectInput
    runs?: TranslationRunCreateNestedManyWithoutProjectInput
  }

  export type TranslationProjectUncheckedCreateWithoutChapterTranslationsInput = {
    id?: string
    novelId: string
    name: string
    targetLanguage?: string
    provider?: string
    model?: string
    systemPrompt?: string | null
    styleGuideJson?: string
    contextMode?: string
    historyDepth?: number
    autoTranslateNewChapters?: boolean
    chapterConcurrency?: number
    isActiveAuto?: boolean
    isDefaultEdition?: boolean
    status?: string
    lastError?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    glossaries?: TranslationGlossaryUncheckedCreateNestedManyWithoutProjectInput
    runs?: TranslationRunUncheckedCreateNestedManyWithoutProjectInput
  }

  export type TranslationProjectCreateOrConnectWithoutChapterTranslationsInput = {
    where: TranslationProjectWhereUniqueInput
    create: XOR<TranslationProjectCreateWithoutChapterTranslationsInput, TranslationProjectUncheckedCreateWithoutChapterTranslationsInput>
  }

  export type ChapterCreateWithoutTranslationsInput = {
    id?: string
    chapterIndex: number
    title: string
    sourceUrl: string
    status?: string
    epubPath?: string | null
    fileSize?: number | null
    checksum?: string | null
    retryCount?: number
    publishedAt?: Date | string | null
    lastError?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    novel: NovelCreateNestedOneWithoutChaptersInput
  }

  export type ChapterUncheckedCreateWithoutTranslationsInput = {
    id?: string
    novelId: string
    chapterIndex: number
    title: string
    sourceUrl: string
    status?: string
    epubPath?: string | null
    fileSize?: number | null
    checksum?: string | null
    retryCount?: number
    publishedAt?: Date | string | null
    lastError?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ChapterCreateOrConnectWithoutTranslationsInput = {
    where: ChapterWhereUniqueInput
    create: XOR<ChapterCreateWithoutTranslationsInput, ChapterUncheckedCreateWithoutTranslationsInput>
  }

  export type ChapterTranslationVersionCreateWithoutChapterTranslationInput = {
    id?: string
    versionNumber: number
    kind: string
    title?: string | null
    htmlPath: string
    textPath?: string | null
    summary?: string | null
    provider?: string | null
    model?: string | null
    promptSnapshot?: string | null
    glossaryVersion?: number | null
    sourceChecksum: string
    isPublished?: boolean
    createdBy?: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ChapterTranslationVersionUncheckedCreateWithoutChapterTranslationInput = {
    id?: string
    versionNumber: number
    kind: string
    title?: string | null
    htmlPath: string
    textPath?: string | null
    summary?: string | null
    provider?: string | null
    model?: string | null
    promptSnapshot?: string | null
    glossaryVersion?: number | null
    sourceChecksum: string
    isPublished?: boolean
    createdBy?: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ChapterTranslationVersionCreateOrConnectWithoutChapterTranslationInput = {
    where: ChapterTranslationVersionWhereUniqueInput
    create: XOR<ChapterTranslationVersionCreateWithoutChapterTranslationInput, ChapterTranslationVersionUncheckedCreateWithoutChapterTranslationInput>
  }

  export type ChapterTranslationVersionCreateManyChapterTranslationInputEnvelope = {
    data: ChapterTranslationVersionCreateManyChapterTranslationInput | ChapterTranslationVersionCreateManyChapterTranslationInput[]
  }

  export type TranslationProjectUpsertWithoutChapterTranslationsInput = {
    update: XOR<TranslationProjectUpdateWithoutChapterTranslationsInput, TranslationProjectUncheckedUpdateWithoutChapterTranslationsInput>
    create: XOR<TranslationProjectCreateWithoutChapterTranslationsInput, TranslationProjectUncheckedCreateWithoutChapterTranslationsInput>
    where?: TranslationProjectWhereInput
  }

  export type TranslationProjectUpdateToOneWithWhereWithoutChapterTranslationsInput = {
    where?: TranslationProjectWhereInput
    data: XOR<TranslationProjectUpdateWithoutChapterTranslationsInput, TranslationProjectUncheckedUpdateWithoutChapterTranslationsInput>
  }

  export type TranslationProjectUpdateWithoutChapterTranslationsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    targetLanguage?: StringFieldUpdateOperationsInput | string
    provider?: StringFieldUpdateOperationsInput | string
    model?: StringFieldUpdateOperationsInput | string
    systemPrompt?: NullableStringFieldUpdateOperationsInput | string | null
    styleGuideJson?: StringFieldUpdateOperationsInput | string
    contextMode?: StringFieldUpdateOperationsInput | string
    historyDepth?: IntFieldUpdateOperationsInput | number
    autoTranslateNewChapters?: BoolFieldUpdateOperationsInput | boolean
    chapterConcurrency?: IntFieldUpdateOperationsInput | number
    isActiveAuto?: BoolFieldUpdateOperationsInput | boolean
    isDefaultEdition?: BoolFieldUpdateOperationsInput | boolean
    status?: StringFieldUpdateOperationsInput | string
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    novel?: NovelUpdateOneRequiredWithoutTranslationProjectsNestedInput
    glossaries?: TranslationGlossaryUpdateManyWithoutProjectNestedInput
    runs?: TranslationRunUpdateManyWithoutProjectNestedInput
  }

  export type TranslationProjectUncheckedUpdateWithoutChapterTranslationsInput = {
    id?: StringFieldUpdateOperationsInput | string
    novelId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    targetLanguage?: StringFieldUpdateOperationsInput | string
    provider?: StringFieldUpdateOperationsInput | string
    model?: StringFieldUpdateOperationsInput | string
    systemPrompt?: NullableStringFieldUpdateOperationsInput | string | null
    styleGuideJson?: StringFieldUpdateOperationsInput | string
    contextMode?: StringFieldUpdateOperationsInput | string
    historyDepth?: IntFieldUpdateOperationsInput | number
    autoTranslateNewChapters?: BoolFieldUpdateOperationsInput | boolean
    chapterConcurrency?: IntFieldUpdateOperationsInput | number
    isActiveAuto?: BoolFieldUpdateOperationsInput | boolean
    isDefaultEdition?: BoolFieldUpdateOperationsInput | boolean
    status?: StringFieldUpdateOperationsInput | string
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    glossaries?: TranslationGlossaryUncheckedUpdateManyWithoutProjectNestedInput
    runs?: TranslationRunUncheckedUpdateManyWithoutProjectNestedInput
  }

  export type ChapterUpsertWithoutTranslationsInput = {
    update: XOR<ChapterUpdateWithoutTranslationsInput, ChapterUncheckedUpdateWithoutTranslationsInput>
    create: XOR<ChapterCreateWithoutTranslationsInput, ChapterUncheckedCreateWithoutTranslationsInput>
    where?: ChapterWhereInput
  }

  export type ChapterUpdateToOneWithWhereWithoutTranslationsInput = {
    where?: ChapterWhereInput
    data: XOR<ChapterUpdateWithoutTranslationsInput, ChapterUncheckedUpdateWithoutTranslationsInput>
  }

  export type ChapterUpdateWithoutTranslationsInput = {
    id?: StringFieldUpdateOperationsInput | string
    chapterIndex?: IntFieldUpdateOperationsInput | number
    title?: StringFieldUpdateOperationsInput | string
    sourceUrl?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    epubPath?: NullableStringFieldUpdateOperationsInput | string | null
    fileSize?: NullableIntFieldUpdateOperationsInput | number | null
    checksum?: NullableStringFieldUpdateOperationsInput | string | null
    retryCount?: IntFieldUpdateOperationsInput | number
    publishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    novel?: NovelUpdateOneRequiredWithoutChaptersNestedInput
  }

  export type ChapterUncheckedUpdateWithoutTranslationsInput = {
    id?: StringFieldUpdateOperationsInput | string
    novelId?: StringFieldUpdateOperationsInput | string
    chapterIndex?: IntFieldUpdateOperationsInput | number
    title?: StringFieldUpdateOperationsInput | string
    sourceUrl?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    epubPath?: NullableStringFieldUpdateOperationsInput | string | null
    fileSize?: NullableIntFieldUpdateOperationsInput | number | null
    checksum?: NullableStringFieldUpdateOperationsInput | string | null
    retryCount?: IntFieldUpdateOperationsInput | number
    publishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChapterTranslationVersionUpsertWithWhereUniqueWithoutChapterTranslationInput = {
    where: ChapterTranslationVersionWhereUniqueInput
    update: XOR<ChapterTranslationVersionUpdateWithoutChapterTranslationInput, ChapterTranslationVersionUncheckedUpdateWithoutChapterTranslationInput>
    create: XOR<ChapterTranslationVersionCreateWithoutChapterTranslationInput, ChapterTranslationVersionUncheckedCreateWithoutChapterTranslationInput>
  }

  export type ChapterTranslationVersionUpdateWithWhereUniqueWithoutChapterTranslationInput = {
    where: ChapterTranslationVersionWhereUniqueInput
    data: XOR<ChapterTranslationVersionUpdateWithoutChapterTranslationInput, ChapterTranslationVersionUncheckedUpdateWithoutChapterTranslationInput>
  }

  export type ChapterTranslationVersionUpdateManyWithWhereWithoutChapterTranslationInput = {
    where: ChapterTranslationVersionScalarWhereInput
    data: XOR<ChapterTranslationVersionUpdateManyMutationInput, ChapterTranslationVersionUncheckedUpdateManyWithoutChapterTranslationInput>
  }

  export type ChapterTranslationVersionScalarWhereInput = {
    AND?: ChapterTranslationVersionScalarWhereInput | ChapterTranslationVersionScalarWhereInput[]
    OR?: ChapterTranslationVersionScalarWhereInput[]
    NOT?: ChapterTranslationVersionScalarWhereInput | ChapterTranslationVersionScalarWhereInput[]
    id?: StringFilter<"ChapterTranslationVersion"> | string
    chapterTranslationId?: StringFilter<"ChapterTranslationVersion"> | string
    versionNumber?: IntFilter<"ChapterTranslationVersion"> | number
    kind?: StringFilter<"ChapterTranslationVersion"> | string
    title?: StringNullableFilter<"ChapterTranslationVersion"> | string | null
    htmlPath?: StringFilter<"ChapterTranslationVersion"> | string
    textPath?: StringNullableFilter<"ChapterTranslationVersion"> | string | null
    summary?: StringNullableFilter<"ChapterTranslationVersion"> | string | null
    provider?: StringNullableFilter<"ChapterTranslationVersion"> | string | null
    model?: StringNullableFilter<"ChapterTranslationVersion"> | string | null
    promptSnapshot?: StringNullableFilter<"ChapterTranslationVersion"> | string | null
    glossaryVersion?: IntNullableFilter<"ChapterTranslationVersion"> | number | null
    sourceChecksum?: StringFilter<"ChapterTranslationVersion"> | string
    isPublished?: BoolFilter<"ChapterTranslationVersion"> | boolean
    createdBy?: StringFilter<"ChapterTranslationVersion"> | string
    createdAt?: DateTimeFilter<"ChapterTranslationVersion"> | Date | string
    updatedAt?: DateTimeFilter<"ChapterTranslationVersion"> | Date | string
  }

  export type ChapterTranslationCreateWithoutVersionsInput = {
    id?: string
    sourceChecksum: string
    status?: string
    currentPublishedVersionId?: string | null
    latestGeneratedVersionId?: string | null
    hasManualEdits?: boolean
    newGeneratedAvailable?: boolean
    staleReason?: string | null
    lastError?: string | null
    retryCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    project: TranslationProjectCreateNestedOneWithoutChapterTranslationsInput
    chapter: ChapterCreateNestedOneWithoutTranslationsInput
  }

  export type ChapterTranslationUncheckedCreateWithoutVersionsInput = {
    id?: string
    projectId: string
    chapterId: string
    sourceChecksum: string
    status?: string
    currentPublishedVersionId?: string | null
    latestGeneratedVersionId?: string | null
    hasManualEdits?: boolean
    newGeneratedAvailable?: boolean
    staleReason?: string | null
    lastError?: string | null
    retryCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ChapterTranslationCreateOrConnectWithoutVersionsInput = {
    where: ChapterTranslationWhereUniqueInput
    create: XOR<ChapterTranslationCreateWithoutVersionsInput, ChapterTranslationUncheckedCreateWithoutVersionsInput>
  }

  export type ChapterTranslationUpsertWithoutVersionsInput = {
    update: XOR<ChapterTranslationUpdateWithoutVersionsInput, ChapterTranslationUncheckedUpdateWithoutVersionsInput>
    create: XOR<ChapterTranslationCreateWithoutVersionsInput, ChapterTranslationUncheckedCreateWithoutVersionsInput>
    where?: ChapterTranslationWhereInput
  }

  export type ChapterTranslationUpdateToOneWithWhereWithoutVersionsInput = {
    where?: ChapterTranslationWhereInput
    data: XOR<ChapterTranslationUpdateWithoutVersionsInput, ChapterTranslationUncheckedUpdateWithoutVersionsInput>
  }

  export type ChapterTranslationUpdateWithoutVersionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    sourceChecksum?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    currentPublishedVersionId?: NullableStringFieldUpdateOperationsInput | string | null
    latestGeneratedVersionId?: NullableStringFieldUpdateOperationsInput | string | null
    hasManualEdits?: BoolFieldUpdateOperationsInput | boolean
    newGeneratedAvailable?: BoolFieldUpdateOperationsInput | boolean
    staleReason?: NullableStringFieldUpdateOperationsInput | string | null
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    retryCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    project?: TranslationProjectUpdateOneRequiredWithoutChapterTranslationsNestedInput
    chapter?: ChapterUpdateOneRequiredWithoutTranslationsNestedInput
  }

  export type ChapterTranslationUncheckedUpdateWithoutVersionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    projectId?: StringFieldUpdateOperationsInput | string
    chapterId?: StringFieldUpdateOperationsInput | string
    sourceChecksum?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    currentPublishedVersionId?: NullableStringFieldUpdateOperationsInput | string | null
    latestGeneratedVersionId?: NullableStringFieldUpdateOperationsInput | string | null
    hasManualEdits?: BoolFieldUpdateOperationsInput | boolean
    newGeneratedAvailable?: BoolFieldUpdateOperationsInput | boolean
    staleReason?: NullableStringFieldUpdateOperationsInput | string | null
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    retryCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TranslationProjectCreateWithoutRunsInput = {
    id?: string
    name: string
    targetLanguage?: string
    provider?: string
    model?: string
    systemPrompt?: string | null
    styleGuideJson?: string
    contextMode?: string
    historyDepth?: number
    autoTranslateNewChapters?: boolean
    chapterConcurrency?: number
    isActiveAuto?: boolean
    isDefaultEdition?: boolean
    status?: string
    lastError?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    novel: NovelCreateNestedOneWithoutTranslationProjectsInput
    glossaries?: TranslationGlossaryCreateNestedManyWithoutProjectInput
    chapterTranslations?: ChapterTranslationCreateNestedManyWithoutProjectInput
  }

  export type TranslationProjectUncheckedCreateWithoutRunsInput = {
    id?: string
    novelId: string
    name: string
    targetLanguage?: string
    provider?: string
    model?: string
    systemPrompt?: string | null
    styleGuideJson?: string
    contextMode?: string
    historyDepth?: number
    autoTranslateNewChapters?: boolean
    chapterConcurrency?: number
    isActiveAuto?: boolean
    isDefaultEdition?: boolean
    status?: string
    lastError?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    glossaries?: TranslationGlossaryUncheckedCreateNestedManyWithoutProjectInput
    chapterTranslations?: ChapterTranslationUncheckedCreateNestedManyWithoutProjectInput
  }

  export type TranslationProjectCreateOrConnectWithoutRunsInput = {
    where: TranslationProjectWhereUniqueInput
    create: XOR<TranslationProjectCreateWithoutRunsInput, TranslationProjectUncheckedCreateWithoutRunsInput>
  }

  export type TranslationProjectUpsertWithoutRunsInput = {
    update: XOR<TranslationProjectUpdateWithoutRunsInput, TranslationProjectUncheckedUpdateWithoutRunsInput>
    create: XOR<TranslationProjectCreateWithoutRunsInput, TranslationProjectUncheckedCreateWithoutRunsInput>
    where?: TranslationProjectWhereInput
  }

  export type TranslationProjectUpdateToOneWithWhereWithoutRunsInput = {
    where?: TranslationProjectWhereInput
    data: XOR<TranslationProjectUpdateWithoutRunsInput, TranslationProjectUncheckedUpdateWithoutRunsInput>
  }

  export type TranslationProjectUpdateWithoutRunsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    targetLanguage?: StringFieldUpdateOperationsInput | string
    provider?: StringFieldUpdateOperationsInput | string
    model?: StringFieldUpdateOperationsInput | string
    systemPrompt?: NullableStringFieldUpdateOperationsInput | string | null
    styleGuideJson?: StringFieldUpdateOperationsInput | string
    contextMode?: StringFieldUpdateOperationsInput | string
    historyDepth?: IntFieldUpdateOperationsInput | number
    autoTranslateNewChapters?: BoolFieldUpdateOperationsInput | boolean
    chapterConcurrency?: IntFieldUpdateOperationsInput | number
    isActiveAuto?: BoolFieldUpdateOperationsInput | boolean
    isDefaultEdition?: BoolFieldUpdateOperationsInput | boolean
    status?: StringFieldUpdateOperationsInput | string
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    novel?: NovelUpdateOneRequiredWithoutTranslationProjectsNestedInput
    glossaries?: TranslationGlossaryUpdateManyWithoutProjectNestedInput
    chapterTranslations?: ChapterTranslationUpdateManyWithoutProjectNestedInput
  }

  export type TranslationProjectUncheckedUpdateWithoutRunsInput = {
    id?: StringFieldUpdateOperationsInput | string
    novelId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    targetLanguage?: StringFieldUpdateOperationsInput | string
    provider?: StringFieldUpdateOperationsInput | string
    model?: StringFieldUpdateOperationsInput | string
    systemPrompt?: NullableStringFieldUpdateOperationsInput | string | null
    styleGuideJson?: StringFieldUpdateOperationsInput | string
    contextMode?: StringFieldUpdateOperationsInput | string
    historyDepth?: IntFieldUpdateOperationsInput | number
    autoTranslateNewChapters?: BoolFieldUpdateOperationsInput | boolean
    chapterConcurrency?: IntFieldUpdateOperationsInput | number
    isActiveAuto?: BoolFieldUpdateOperationsInput | boolean
    isDefaultEdition?: BoolFieldUpdateOperationsInput | boolean
    status?: StringFieldUpdateOperationsInput | string
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    glossaries?: TranslationGlossaryUncheckedUpdateManyWithoutProjectNestedInput
    chapterTranslations?: ChapterTranslationUncheckedUpdateManyWithoutProjectNestedInput
  }

  export type ChapterCreateManyNovelInput = {
    id?: string
    chapterIndex: number
    title: string
    sourceUrl: string
    status?: string
    epubPath?: string | null
    fileSize?: number | null
    checksum?: string | null
    retryCount?: number
    publishedAt?: Date | string | null
    lastError?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SyncRunCreateManyNovelInput = {
    id?: string
    triggerType: string
    status?: string
    totalFound?: number
    newChapters?: number
    errorMessage?: string | null
    startedAt?: Date | string | null
    endedAt?: Date | string | null
    createdAt?: Date | string
  }

  export type TranslationProjectCreateManyNovelInput = {
    id?: string
    name: string
    targetLanguage?: string
    provider?: string
    model?: string
    systemPrompt?: string | null
    styleGuideJson?: string
    contextMode?: string
    historyDepth?: number
    autoTranslateNewChapters?: boolean
    chapterConcurrency?: number
    isActiveAuto?: boolean
    isDefaultEdition?: boolean
    status?: string
    lastError?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ChapterUpdateWithoutNovelInput = {
    id?: StringFieldUpdateOperationsInput | string
    chapterIndex?: IntFieldUpdateOperationsInput | number
    title?: StringFieldUpdateOperationsInput | string
    sourceUrl?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    epubPath?: NullableStringFieldUpdateOperationsInput | string | null
    fileSize?: NullableIntFieldUpdateOperationsInput | number | null
    checksum?: NullableStringFieldUpdateOperationsInput | string | null
    retryCount?: IntFieldUpdateOperationsInput | number
    publishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    translations?: ChapterTranslationUpdateManyWithoutChapterNestedInput
  }

  export type ChapterUncheckedUpdateWithoutNovelInput = {
    id?: StringFieldUpdateOperationsInput | string
    chapterIndex?: IntFieldUpdateOperationsInput | number
    title?: StringFieldUpdateOperationsInput | string
    sourceUrl?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    epubPath?: NullableStringFieldUpdateOperationsInput | string | null
    fileSize?: NullableIntFieldUpdateOperationsInput | number | null
    checksum?: NullableStringFieldUpdateOperationsInput | string | null
    retryCount?: IntFieldUpdateOperationsInput | number
    publishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    translations?: ChapterTranslationUncheckedUpdateManyWithoutChapterNestedInput
  }

  export type ChapterUncheckedUpdateManyWithoutNovelInput = {
    id?: StringFieldUpdateOperationsInput | string
    chapterIndex?: IntFieldUpdateOperationsInput | number
    title?: StringFieldUpdateOperationsInput | string
    sourceUrl?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    epubPath?: NullableStringFieldUpdateOperationsInput | string | null
    fileSize?: NullableIntFieldUpdateOperationsInput | number | null
    checksum?: NullableStringFieldUpdateOperationsInput | string | null
    retryCount?: IntFieldUpdateOperationsInput | number
    publishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SyncRunUpdateWithoutNovelInput = {
    id?: StringFieldUpdateOperationsInput | string
    triggerType?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    totalFound?: IntFieldUpdateOperationsInput | number
    newChapters?: IntFieldUpdateOperationsInput | number
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SyncRunUncheckedUpdateWithoutNovelInput = {
    id?: StringFieldUpdateOperationsInput | string
    triggerType?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    totalFound?: IntFieldUpdateOperationsInput | number
    newChapters?: IntFieldUpdateOperationsInput | number
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SyncRunUncheckedUpdateManyWithoutNovelInput = {
    id?: StringFieldUpdateOperationsInput | string
    triggerType?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    totalFound?: IntFieldUpdateOperationsInput | number
    newChapters?: IntFieldUpdateOperationsInput | number
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TranslationProjectUpdateWithoutNovelInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    targetLanguage?: StringFieldUpdateOperationsInput | string
    provider?: StringFieldUpdateOperationsInput | string
    model?: StringFieldUpdateOperationsInput | string
    systemPrompt?: NullableStringFieldUpdateOperationsInput | string | null
    styleGuideJson?: StringFieldUpdateOperationsInput | string
    contextMode?: StringFieldUpdateOperationsInput | string
    historyDepth?: IntFieldUpdateOperationsInput | number
    autoTranslateNewChapters?: BoolFieldUpdateOperationsInput | boolean
    chapterConcurrency?: IntFieldUpdateOperationsInput | number
    isActiveAuto?: BoolFieldUpdateOperationsInput | boolean
    isDefaultEdition?: BoolFieldUpdateOperationsInput | boolean
    status?: StringFieldUpdateOperationsInput | string
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    glossaries?: TranslationGlossaryUpdateManyWithoutProjectNestedInput
    chapterTranslations?: ChapterTranslationUpdateManyWithoutProjectNestedInput
    runs?: TranslationRunUpdateManyWithoutProjectNestedInput
  }

  export type TranslationProjectUncheckedUpdateWithoutNovelInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    targetLanguage?: StringFieldUpdateOperationsInput | string
    provider?: StringFieldUpdateOperationsInput | string
    model?: StringFieldUpdateOperationsInput | string
    systemPrompt?: NullableStringFieldUpdateOperationsInput | string | null
    styleGuideJson?: StringFieldUpdateOperationsInput | string
    contextMode?: StringFieldUpdateOperationsInput | string
    historyDepth?: IntFieldUpdateOperationsInput | number
    autoTranslateNewChapters?: BoolFieldUpdateOperationsInput | boolean
    chapterConcurrency?: IntFieldUpdateOperationsInput | number
    isActiveAuto?: BoolFieldUpdateOperationsInput | boolean
    isDefaultEdition?: BoolFieldUpdateOperationsInput | boolean
    status?: StringFieldUpdateOperationsInput | string
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    glossaries?: TranslationGlossaryUncheckedUpdateManyWithoutProjectNestedInput
    chapterTranslations?: ChapterTranslationUncheckedUpdateManyWithoutProjectNestedInput
    runs?: TranslationRunUncheckedUpdateManyWithoutProjectNestedInput
  }

  export type TranslationProjectUncheckedUpdateManyWithoutNovelInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    targetLanguage?: StringFieldUpdateOperationsInput | string
    provider?: StringFieldUpdateOperationsInput | string
    model?: StringFieldUpdateOperationsInput | string
    systemPrompt?: NullableStringFieldUpdateOperationsInput | string | null
    styleGuideJson?: StringFieldUpdateOperationsInput | string
    contextMode?: StringFieldUpdateOperationsInput | string
    historyDepth?: IntFieldUpdateOperationsInput | number
    autoTranslateNewChapters?: BoolFieldUpdateOperationsInput | boolean
    chapterConcurrency?: IntFieldUpdateOperationsInput | number
    isActiveAuto?: BoolFieldUpdateOperationsInput | boolean
    isDefaultEdition?: BoolFieldUpdateOperationsInput | boolean
    status?: StringFieldUpdateOperationsInput | string
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChapterTranslationCreateManyChapterInput = {
    id?: string
    projectId: string
    sourceChecksum: string
    status?: string
    currentPublishedVersionId?: string | null
    latestGeneratedVersionId?: string | null
    hasManualEdits?: boolean
    newGeneratedAvailable?: boolean
    staleReason?: string | null
    lastError?: string | null
    retryCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ChapterTranslationUpdateWithoutChapterInput = {
    id?: StringFieldUpdateOperationsInput | string
    sourceChecksum?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    currentPublishedVersionId?: NullableStringFieldUpdateOperationsInput | string | null
    latestGeneratedVersionId?: NullableStringFieldUpdateOperationsInput | string | null
    hasManualEdits?: BoolFieldUpdateOperationsInput | boolean
    newGeneratedAvailable?: BoolFieldUpdateOperationsInput | boolean
    staleReason?: NullableStringFieldUpdateOperationsInput | string | null
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    retryCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    project?: TranslationProjectUpdateOneRequiredWithoutChapterTranslationsNestedInput
    versions?: ChapterTranslationVersionUpdateManyWithoutChapterTranslationNestedInput
  }

  export type ChapterTranslationUncheckedUpdateWithoutChapterInput = {
    id?: StringFieldUpdateOperationsInput | string
    projectId?: StringFieldUpdateOperationsInput | string
    sourceChecksum?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    currentPublishedVersionId?: NullableStringFieldUpdateOperationsInput | string | null
    latestGeneratedVersionId?: NullableStringFieldUpdateOperationsInput | string | null
    hasManualEdits?: BoolFieldUpdateOperationsInput | boolean
    newGeneratedAvailable?: BoolFieldUpdateOperationsInput | boolean
    staleReason?: NullableStringFieldUpdateOperationsInput | string | null
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    retryCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    versions?: ChapterTranslationVersionUncheckedUpdateManyWithoutChapterTranslationNestedInput
  }

  export type ChapterTranslationUncheckedUpdateManyWithoutChapterInput = {
    id?: StringFieldUpdateOperationsInput | string
    projectId?: StringFieldUpdateOperationsInput | string
    sourceChecksum?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    currentPublishedVersionId?: NullableStringFieldUpdateOperationsInput | string | null
    latestGeneratedVersionId?: NullableStringFieldUpdateOperationsInput | string | null
    hasManualEdits?: BoolFieldUpdateOperationsInput | boolean
    newGeneratedAvailable?: BoolFieldUpdateOperationsInput | boolean
    staleReason?: NullableStringFieldUpdateOperationsInput | string | null
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    retryCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TranslationGlossaryCreateManyProjectInput = {
    id?: string
    version: number
    sourceType?: string
    rawPayload?: string
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ChapterTranslationCreateManyProjectInput = {
    id?: string
    chapterId: string
    sourceChecksum: string
    status?: string
    currentPublishedVersionId?: string | null
    latestGeneratedVersionId?: string | null
    hasManualEdits?: boolean
    newGeneratedAvailable?: boolean
    staleReason?: string | null
    lastError?: string | null
    retryCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TranslationRunCreateManyProjectInput = {
    id?: string
    triggerType: string
    scope?: string
    status?: string
    queuedCount?: number
    completedCount?: number
    failedCount?: number
    tokenUsage?: number
    estimatedCost?: number
    errorMessage?: string | null
    startedAt?: Date | string | null
    endedAt?: Date | string | null
    createdAt?: Date | string
  }

  export type TranslationGlossaryUpdateWithoutProjectInput = {
    id?: StringFieldUpdateOperationsInput | string
    version?: IntFieldUpdateOperationsInput | number
    sourceType?: StringFieldUpdateOperationsInput | string
    rawPayload?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    entries?: TranslationGlossaryEntryUpdateManyWithoutGlossaryNestedInput
  }

  export type TranslationGlossaryUncheckedUpdateWithoutProjectInput = {
    id?: StringFieldUpdateOperationsInput | string
    version?: IntFieldUpdateOperationsInput | number
    sourceType?: StringFieldUpdateOperationsInput | string
    rawPayload?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    entries?: TranslationGlossaryEntryUncheckedUpdateManyWithoutGlossaryNestedInput
  }

  export type TranslationGlossaryUncheckedUpdateManyWithoutProjectInput = {
    id?: StringFieldUpdateOperationsInput | string
    version?: IntFieldUpdateOperationsInput | number
    sourceType?: StringFieldUpdateOperationsInput | string
    rawPayload?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChapterTranslationUpdateWithoutProjectInput = {
    id?: StringFieldUpdateOperationsInput | string
    sourceChecksum?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    currentPublishedVersionId?: NullableStringFieldUpdateOperationsInput | string | null
    latestGeneratedVersionId?: NullableStringFieldUpdateOperationsInput | string | null
    hasManualEdits?: BoolFieldUpdateOperationsInput | boolean
    newGeneratedAvailable?: BoolFieldUpdateOperationsInput | boolean
    staleReason?: NullableStringFieldUpdateOperationsInput | string | null
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    retryCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    chapter?: ChapterUpdateOneRequiredWithoutTranslationsNestedInput
    versions?: ChapterTranslationVersionUpdateManyWithoutChapterTranslationNestedInput
  }

  export type ChapterTranslationUncheckedUpdateWithoutProjectInput = {
    id?: StringFieldUpdateOperationsInput | string
    chapterId?: StringFieldUpdateOperationsInput | string
    sourceChecksum?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    currentPublishedVersionId?: NullableStringFieldUpdateOperationsInput | string | null
    latestGeneratedVersionId?: NullableStringFieldUpdateOperationsInput | string | null
    hasManualEdits?: BoolFieldUpdateOperationsInput | boolean
    newGeneratedAvailable?: BoolFieldUpdateOperationsInput | boolean
    staleReason?: NullableStringFieldUpdateOperationsInput | string | null
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    retryCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    versions?: ChapterTranslationVersionUncheckedUpdateManyWithoutChapterTranslationNestedInput
  }

  export type ChapterTranslationUncheckedUpdateManyWithoutProjectInput = {
    id?: StringFieldUpdateOperationsInput | string
    chapterId?: StringFieldUpdateOperationsInput | string
    sourceChecksum?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    currentPublishedVersionId?: NullableStringFieldUpdateOperationsInput | string | null
    latestGeneratedVersionId?: NullableStringFieldUpdateOperationsInput | string | null
    hasManualEdits?: BoolFieldUpdateOperationsInput | boolean
    newGeneratedAvailable?: BoolFieldUpdateOperationsInput | boolean
    staleReason?: NullableStringFieldUpdateOperationsInput | string | null
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    retryCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TranslationRunUpdateWithoutProjectInput = {
    id?: StringFieldUpdateOperationsInput | string
    triggerType?: StringFieldUpdateOperationsInput | string
    scope?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    queuedCount?: IntFieldUpdateOperationsInput | number
    completedCount?: IntFieldUpdateOperationsInput | number
    failedCount?: IntFieldUpdateOperationsInput | number
    tokenUsage?: IntFieldUpdateOperationsInput | number
    estimatedCost?: FloatFieldUpdateOperationsInput | number
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TranslationRunUncheckedUpdateWithoutProjectInput = {
    id?: StringFieldUpdateOperationsInput | string
    triggerType?: StringFieldUpdateOperationsInput | string
    scope?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    queuedCount?: IntFieldUpdateOperationsInput | number
    completedCount?: IntFieldUpdateOperationsInput | number
    failedCount?: IntFieldUpdateOperationsInput | number
    tokenUsage?: IntFieldUpdateOperationsInput | number
    estimatedCost?: FloatFieldUpdateOperationsInput | number
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TranslationRunUncheckedUpdateManyWithoutProjectInput = {
    id?: StringFieldUpdateOperationsInput | string
    triggerType?: StringFieldUpdateOperationsInput | string
    scope?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    queuedCount?: IntFieldUpdateOperationsInput | number
    completedCount?: IntFieldUpdateOperationsInput | number
    failedCount?: IntFieldUpdateOperationsInput | number
    tokenUsage?: IntFieldUpdateOperationsInput | number
    estimatedCost?: FloatFieldUpdateOperationsInput | number
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    startedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TranslationGlossaryEntryCreateManyGlossaryInput = {
    id?: string
    type?: string
    rawName: string
    translatedName: string
    viLabel?: string | null
    gender?: string | null
    description?: string | null
    aliasesJson?: string
    notes?: string | null
    locked?: boolean
    priority?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TranslationGlossaryEntryUpdateWithoutGlossaryInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    rawName?: StringFieldUpdateOperationsInput | string
    translatedName?: StringFieldUpdateOperationsInput | string
    viLabel?: NullableStringFieldUpdateOperationsInput | string | null
    gender?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    aliasesJson?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    locked?: BoolFieldUpdateOperationsInput | boolean
    priority?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TranslationGlossaryEntryUncheckedUpdateWithoutGlossaryInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    rawName?: StringFieldUpdateOperationsInput | string
    translatedName?: StringFieldUpdateOperationsInput | string
    viLabel?: NullableStringFieldUpdateOperationsInput | string | null
    gender?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    aliasesJson?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    locked?: BoolFieldUpdateOperationsInput | boolean
    priority?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TranslationGlossaryEntryUncheckedUpdateManyWithoutGlossaryInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    rawName?: StringFieldUpdateOperationsInput | string
    translatedName?: StringFieldUpdateOperationsInput | string
    viLabel?: NullableStringFieldUpdateOperationsInput | string | null
    gender?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    aliasesJson?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    locked?: BoolFieldUpdateOperationsInput | boolean
    priority?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChapterTranslationVersionCreateManyChapterTranslationInput = {
    id?: string
    versionNumber: number
    kind: string
    title?: string | null
    htmlPath: string
    textPath?: string | null
    summary?: string | null
    provider?: string | null
    model?: string | null
    promptSnapshot?: string | null
    glossaryVersion?: number | null
    sourceChecksum: string
    isPublished?: boolean
    createdBy?: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ChapterTranslationVersionUpdateWithoutChapterTranslationInput = {
    id?: StringFieldUpdateOperationsInput | string
    versionNumber?: IntFieldUpdateOperationsInput | number
    kind?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    htmlPath?: StringFieldUpdateOperationsInput | string
    textPath?: NullableStringFieldUpdateOperationsInput | string | null
    summary?: NullableStringFieldUpdateOperationsInput | string | null
    provider?: NullableStringFieldUpdateOperationsInput | string | null
    model?: NullableStringFieldUpdateOperationsInput | string | null
    promptSnapshot?: NullableStringFieldUpdateOperationsInput | string | null
    glossaryVersion?: NullableIntFieldUpdateOperationsInput | number | null
    sourceChecksum?: StringFieldUpdateOperationsInput | string
    isPublished?: BoolFieldUpdateOperationsInput | boolean
    createdBy?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChapterTranslationVersionUncheckedUpdateWithoutChapterTranslationInput = {
    id?: StringFieldUpdateOperationsInput | string
    versionNumber?: IntFieldUpdateOperationsInput | number
    kind?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    htmlPath?: StringFieldUpdateOperationsInput | string
    textPath?: NullableStringFieldUpdateOperationsInput | string | null
    summary?: NullableStringFieldUpdateOperationsInput | string | null
    provider?: NullableStringFieldUpdateOperationsInput | string | null
    model?: NullableStringFieldUpdateOperationsInput | string | null
    promptSnapshot?: NullableStringFieldUpdateOperationsInput | string | null
    glossaryVersion?: NullableIntFieldUpdateOperationsInput | number | null
    sourceChecksum?: StringFieldUpdateOperationsInput | string
    isPublished?: BoolFieldUpdateOperationsInput | boolean
    createdBy?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChapterTranslationVersionUncheckedUpdateManyWithoutChapterTranslationInput = {
    id?: StringFieldUpdateOperationsInput | string
    versionNumber?: IntFieldUpdateOperationsInput | number
    kind?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    htmlPath?: StringFieldUpdateOperationsInput | string
    textPath?: NullableStringFieldUpdateOperationsInput | string | null
    summary?: NullableStringFieldUpdateOperationsInput | string | null
    provider?: NullableStringFieldUpdateOperationsInput | string | null
    model?: NullableStringFieldUpdateOperationsInput | string | null
    promptSnapshot?: NullableStringFieldUpdateOperationsInput | string | null
    glossaryVersion?: NullableIntFieldUpdateOperationsInput | number | null
    sourceChecksum?: StringFieldUpdateOperationsInput | string
    isPublished?: BoolFieldUpdateOperationsInput | boolean
    createdBy?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}