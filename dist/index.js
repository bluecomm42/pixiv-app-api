"use strict";
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const querystring_1 = require("querystring");
const crypto_1 = require("crypto");
const url_1 = require("url");
const axios_1 = __importDefault(require("axios"));
const decamelize_keys_1 = __importDefault(require("decamelize-keys"));
const camelcase_keys_1 = __importDefault(require("camelcase-keys"));
const baseURL = 'https://app-api.pixiv.net/';
const appVersion = '7.10.10';
const userAgent = `PixiviOSApp/${appVersion} (iOS 14.4)`;
const instance = axios_1.default.create({
    baseURL,
    headers: {
        'App-OS': 'ios',
        'App-OS-Version': '14.4',
        'App-Version': appVersion,
        'User-Agent': userAgent,
    },
});
const CLIENT_ID = 'MOBrBDS8blbauoSck0ZfDbtuzpyT';
const CLIENT_SECRET = 'lsACyCD94FhDUtGTXi3QzcFE2uU1hqtDaKeqrdwj';
const HASH_SECRET = '28c1fdd170a5204386cb1313c7077b34f83e4aaf4aa829ce78c231e05b0bae2c';
const filter = 'for_ios';
class PixivApp {
    constructor(refreshToken, options) {
        Object.defineProperty(this, "camelcaseKeys", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "refreshToken", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "nextUrl", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "auth", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_once", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.refreshToken = refreshToken;
        this.nextUrl = null;
        this.auth = null;
        this._once = false;
        if (options) {
            this.camelcaseKeys = Boolean(options.camelcaseKeys);
        }
        else {
            this.camelcaseKeys = true;
        }
    }
    async login(refreshToken) {
        this.refreshToken = refreshToken || this.refreshToken;
        if (typeof this.refreshToken !== 'string') {
            return Promise.reject(new TypeError(`Auth is required. Expected a string, got ${typeof this.refreshToken}`));
        }
        const now_time = new Date();
        const local_time = `${now_time.getUTCFullYear()}-${now_time.getUTCMonth() + 1}-${now_time.getUTCDate()}T${now_time
            .getUTCHours()
            .toString()
            .padStart(2, '0')}:${now_time
            .getUTCMinutes()
            .toString()
            .padStart(2, '0')}:${now_time
            .getUTCSeconds()
            .toString()
            .padStart(2, '0')}+00:00`;
        const headers = {
            'User-Agent': userAgent,
            'X-Client-Time': local_time,
            'X-Client-Hash': crypto_1.createHash('md5')
                .update(Buffer.from(`${local_time}${HASH_SECRET}`, 'utf8'))
                .digest('hex'),
        };
        const data = {
            clientId: CLIENT_ID,
            clientSecret: CLIENT_SECRET,
            getSecureUrl: '1',
            grantType: '',
            refreshToken: '',
        };
        data.grantType = 'refresh_token';
        data.refreshToken = this.refreshToken;
        const axiosResponse = await axios_1.default.post('https://oauth.secure.pixiv.net/auth/token', querystring_1.stringify(decamelize_keys_1.default(data)), { headers });
        const { response } = axiosResponse.data;
        this.auth = response;
        this.refreshToken = response.refresh_token;
        this.authToken = response.access_token;
        return this.camelcaseKeys
            ? camelcase_keys_1.default(response, { deep: true })
            : response;
    }
    authInfo() {
        return this.camelcaseKeys
            ? camelcase_keys_1.default(this.auth, {
                deep: true,
            })
            : this.auth;
    }
    // eslint-disable-next-line class-methods-use-this
    set authToken(accessToken) {
        instance.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
    }
    hasNext() {
        return Boolean(this.nextUrl);
    }
    next() {
        return this.fetch(this.nextUrl);
    }
    nextQuery() {
        // This always returns undefined
        // @ts-ignore
        return url_1.parse(this.nextUrl, true).params;
    }
    makeIterable(resp) {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;
        const nextUrl = this.camelcaseKeys ? 'nextUrl' : 'next_url';
        return {
            [Symbol.asyncIterator]() {
                return __asyncGenerator(this, arguments, function* _a() {
                    yield yield __await(resp);
                    while (resp[nextUrl]) {
                        // eslint-disable-next-line require-atomic-updates
                        resp = yield __await(self.fetch(resp[nextUrl]));
                        yield yield __await(resp);
                    }
                });
            },
        };
    }
    userDetail(id, params) {
        params = Object.assign({ userId: id, filter }, params);
        return this.fetch('/v1/user/detail', { params });
    }
    userIllusts(id, params) {
        params = Object.assign({ userId: id, type: 'illust', filter }, params);
        return this.fetch('/v1/user/illusts', { params });
    }
    // This endpoint doesn't exist
    userFollowAdd(id, params) {
        if (!id) {
            return Promise.reject(new Error('userId required'));
        }
        params = Object.assign({ userId: id, restrict: 'public', filter }, params);
        return this.fetch('/v1/user/follow/add', { params });
    }
    // This endpoint doesn't exist
    userFollowDelete(id, params) {
        if (!id) {
            return Promise.reject(new Error('userId required'));
        }
        params = Object.assign({ userId: id, restrict: 'public', filter }, params);
        return this.fetch('/v1/user/follow/delete', { params });
    }
    userBookmarksIllust(id, params) {
        if (!id) {
            return Promise.reject(new Error('userId required'));
        }
        params = Object.assign({ userId: id, restrict: 'public', filter }, params);
        return this.fetch('/v1/user/bookmarks/illust', { params });
    }
    userFollowing(id, params) {
        if (!id) {
            return Promise.reject(new Error('userId required'));
        }
        params = Object.assign({ userId: id, restrict: 'public' }, params);
        return this.fetch('/v1/user/following', { params });
    }
    userFollower(id, params) {
        if (!id) {
            return Promise.reject(new Error('userId required'));
        }
        params = Object.assign({ userId: id }, params);
        return this.fetch('/v1/user/follower', { params });
    }
    userMypixiv(id, params) {
        if (!id) {
            return Promise.reject(new Error('userId required'));
        }
        params = Object.assign({ userId: id }, params);
        return this.fetch('/v1/user/mypixiv', { params });
    }
    // This endpoint doesn't exist
    userList(id, params) {
        if (!id) {
            return Promise.reject(new Error('userId required'));
        }
        params = Object.assign({ userId: id, filter }, params);
        return this.fetch('/v1/user/list', { params });
    }
    illustDetail(id, params) {
        if (!id) {
            return Promise.reject(new Error('illustId required'));
        }
        params = Object.assign({ illustId: id, filter }, params);
        return this.fetch('/v1/illust/detail', { params });
    }
    illustNew(params) {
        params = Object.assign({ contentType: 'illust', filter }, params);
        return this.fetch('/v1/illust/new', { params });
    }
    illustFollow(id, params) {
        params = Object.assign({ userId: id, restrict: 'public' }, params);
        return this.fetch('/v2/illust/follow', { params });
    }
    illustComments(id, params) {
        if (!id) {
            return Promise.reject(new Error('illustId required'));
        }
        params = Object.assign({ illustId: id, includeTotalComments: true }, params);
        return this.fetch('/v1/illust/comments', { params });
    }
    illustRelated(id, params) {
        if (!id) {
            return Promise.reject(new Error('illustId required'));
        }
        params = Object.assign({ illustId: id, filter }, params);
        return this.fetch('/v2/illust/related', { params });
    }
    illustRecommended(params) {
        params = Object.assign({ contentType: 'illust', includeRankingLabel: true, filter }, params);
        return this.fetch('/v1/illust/recommended', { params });
    }
    illustRecommendedNologin(params) {
        params = Object.assign({ includeRankingIllusts: true, filter }, params);
        return this.fetch('/v1/illust/recommended-nologin', { params });
    }
    illustRanking(params) {
        params = Object.assign({ mode: 'day', filter }, params);
        return this.fetch('/v1/illust/ranking', { params });
    }
    trendingTagsIllust(params) {
        params = Object.assign({ filter }, params);
        return this.fetch('/v1/trending-tags/illust', { params });
    }
    searchIllust(word, params) {
        if (!word) {
            return Promise.reject(new Error('Word required'));
        }
        params = Object.assign({ word, searchTarget: 'partial_match_for_tags', sort: 'date_desc', filter }, params);
        return this.fetch('/v1/search/illust', { params });
    }
    searchNovel(word, params) {
        if (!word) {
            return Promise.reject(new Error('Word required'));
        }
        params = Object.assign({ word, searchTarget: 'partial_match_for_tags', sort: 'date_desc', filter }, params);
        return this.fetch('/v1/search/novel', { params });
    }
    searchUser(word, params) {
        if (!word) {
            return Promise.reject(new Error('Word required'));
        }
        params = Object.assign({ word,
            filter }, params);
        return this.fetch('/v1/search/user', { params });
    }
    searchAutoComplete(word) {
        if (!word) {
            return Promise.reject(new Error('word required'));
        }
        return this.fetch('/v1/search/autocomplete', { params: { word } });
    }
    illustBookmarkDetail(id, params) {
        if (!id) {
            return Promise.reject(new Error('illustId required'));
        }
        params = Object.assign({ illustId: id }, params);
        return this.fetch('/v2/illust/bookmark/detail', { params });
    }
    illustBookmarkAdd(id, params) {
        if (!id) {
            return Promise.reject(new Error('illustId required'));
        }
        params = Object.assign({ illustId: id, restrict: 'public' }, params);
        return this.fetch('/v2/illust/bookmark/add', { data: params });
    }
    illustBookmarkDelete(id, params) {
        if (!id) {
            return Promise.reject(new Error('illustId required'));
        }
        params = Object.assign({ illustId: id }, params);
        return this.fetch('/v1/illust/bookmark/delete', { data: params });
    }
    userBookmarkTagsIllust(params) {
        params = Object.assign({ restrict: 'public' }, params);
        return this.fetch('/v1/user/bookmark-tags/illust', { params });
    }
    novelRecommended(params) {
        params = Object.assign({ includeRankingNovels: true, filter }, params);
        return this.fetch('/v1/novel/recommended', { params });
    }
    // This endpoint doesn't exist
    mangaNew(params) {
        params = Object.assign({ contentType: 'manga', filter }, params);
        return this.fetch('/v1/manga/new', { params });
    }
    mangaRecommended(params) {
        params = Object.assign({ includeRankingLabel: true, filter }, params);
        return this.fetch('/v1/manga/recommended', { params });
    }
    novelRecommendedNologin(params) {
        params = Object.assign({ includeRankingNovels: true, filter }, params);
        return this.fetch('/v1/novel/recommended-nologin', { params });
    }
    novelNew(params) {
        params = Object.assign({ filter }, params);
        return this.fetch('/v1/novel/new', { params });
    }
    ugoiraMetaData(id, params) {
        if (!id) {
            return Promise.reject(new Error('illustId required'));
        }
        params = Object.assign({ illustId: id, filter }, params);
        return this.fetch('/v1/ugoira/metadata', { params });
    }
    async fetch(target, options) {
        if (!target) {
            return Promise.reject(new Error('url required'));
        }
        try {
            return this._get(target, options);
        }
        catch (error) {
            if (this._once) {
                this._once = false;
                throw error;
            }
            await this.login();
            this._once = true;
            return this._get(target, options);
        }
    }
    async _get(target, options = {}) {
        options = options || {};
        if (options.data) {
            options.method = 'post';
            options.headers = {
                'Content-Type': 'application/x-www-form-urlencoded',
            };
            options.data = querystring_1.stringify(decamelize_keys_1.default(options.data));
        }
        if (options.params) {
            options.params = decamelize_keys_1.default(options.params);
        }
        const { data } = await instance(target, options);
        this.nextUrl = data && data.next_url ? data.next_url : null;
        return this.camelcaseKeys ? camelcase_keys_1.default(data, { deep: true }) : data;
    }
}
exports.default = PixivApp;
module.exports.default = PixivApp;
module.exports = PixivApp;
//# sourceMappingURL=index.js.map