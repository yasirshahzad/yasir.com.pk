import rss from './rss'

async function postbuild() {
  await rss()
  console.log('Post-build systems complete.')
  process.exit(0)
}

postbuild()
