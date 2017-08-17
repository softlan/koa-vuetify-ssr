process.env.VUE_ENV = 'server'
const isProd = process.env.NODE_ENV === 'production'

const Koa = require('koa');
const Router = require('koa-router');
const router = new Router();
const favicon = require('koa-favicon');
const serve = require('koa-static-server')

const app = new Koa();

const fs = require('fs')
const path = require('path')

const vueRenderer = require('vue-server-renderer')
const devServer = require('./build/dev-server')
const resolve = file => path.resolve(__dirname, file)

const lru = require('lru-cache')
const serialize = require('serialize-javascript')


const parseHTML = tmpl => {
    const placeholder = '{{ APP }}'
    const i = tmpl.indexOf(placeholder)
    return {
        head: tmpl.slice(0, i),
        tail: tmpl.slice(i + placeholder.length)
    }
}

const parseMeta = (head, context) => {
    const title = context.title || ''
    const description = context.description || ''
    const keywords = context.keywords || ''
    head = head.replace(/(<title>)(.*?)(<\/title>)/, `$1${title}$3`)
    head = head.replace(/(<meta name=description content=")(.*?)(">)/, `$1${description}$3`)
    head = head.replace(/(<meta name=keywords content=")(.*?)(">)/, `$1${keywords}$3`)
    return head
}


let indexHTML
let renderer

const createRenderer = bundle => {
    // https://github.com/isaacs/node-lru-cache#options
    return vueRenderer.createBundleRenderer(bundle, {
        cache: lru({
            max: 1000,
            maxAge: 1000 * 60 * 15
        })
    })
}

if (isProd) {
    renderer = createRenderer(fs.readFileSync(resolve('./dist/server-bundle.js'), 'utf-8'))
    indexHTML = parseHTML(fs.readFileSync(resolve('./dist/index.html'), 'utf-8'))
} else {
    devServer(app, {
        indexUpdated: index => {
            indexHTML = parseHTML(index)
        },
        bundleUpdated: bundle => {
            renderer = createRenderer(bundle)
        }
    })
}

const handleError = err => {
    if (err && err.code === 404) {
        ctx.state = 404;
        ctx.message = '404, Page Not Found';
    } else {
        // Render Error Page or Redirect
        ctx.state = 500;
        ctx.message = '500 Internal Error';
        console.error(`error during render : ${ctx.url}`)
        console.error(err.stack)
    }
}

app.use(favicon('./public/favicon.ico'))
app.use(serve({ rootDir: 'dist', rootPath: '/dist' }))
app.use(serve({ rootDir: 'public', rootPath: '/public' }))

router.get('*', async (ctx, next) => {

    if (!renderer) {
        ctx.body = 'the renderer is not ready, just wait a minute'
    }

    ctx.set('Content-Type', 'text-html')

    const context = { url: ctx.url };

    renderer.renderToString(context, (err, html) => {
        if (err) {
            return handleError(err)
        }

        ctx.body = parseMeta(indexHTML.head, context);

        ctx.body += html

        if (context.initialState) {
            ctx.body +=
                `<script>window.__INITIAL_STATE__=${
                serialize(context.initialState, { isJSON: true })
                }</script>`
        }

        ctx.body += indexHTML.tail
    })

    await next();

});

app.use(router.routes());

const PORT = process.env.PORT || 3000
const HOST = process.env.HOST || 'localhost'

app.listen(3000);

console.log(`server started at ${HOST}:${PORT} `)