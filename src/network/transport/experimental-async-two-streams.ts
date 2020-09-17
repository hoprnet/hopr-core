const gen1 = (async function* gen1() {
  let result = new TextEncoder().encode('A')
  let i = 0

  while (true) {
    await new Promise((resolve) => setTimeout(resolve, 100))
    yield result
    result[0] += 1

    if (i++ == 15) {
      return result
    }
  }
})()

const gen2 = (async function* gen2() {
  let result = 0
  while (true) {
    await new Promise((resolve) => setTimeout(resolve, 150))
    yield result++

    if (result == 23) {
      return result
    }
  }
})()

const it2 = (async function* foo() {
  let aPromise: Promise<IteratorResult<Uint8Array, Uint8Array>>
  let bPromise: Promise<IteratorResult<number, number>>

  aPromise = gen1.next()
  bPromise = gen2.next()

  let aResolved = false
  let bResolved = false

  let aFinished = false
  let bFinished = false

  while (true) {
    if (!aFinished && !bFinished) {
      await Promise.race([
        aPromise.then(({ done }) => {
          //console.log(`from first iterator`, result.value)
          aResolved = true

          console.log(`a done`, done)
          if (done) {
            aFinished = true
          }
        }),
        bPromise.then(({ done }) => {
          // console.log(`from second iterator`, result.value)
          bResolved = true

          console.log(`b done`, done)
          if (done) {
            bFinished = true
          }
        }),
      ])
    }

    if (aFinished) {
      await bPromise.then(({ done }) => {
        // console.log(`from second iterator`, result.value)
        bResolved = true

        console.log(`b done`, done)
        if (done) {
          bFinished = true
        }
      })
    }
    
    if (bFinished) {
      await aPromise.then(({ done }) => {
        //console.log(`from first iterator`, result.value)
        aResolved = true

        console.log(`a done`, done)
        if (done) {
          aFinished = true
        }
      })
    }

    if (aResolved || bFinished) {
      if (aFinished && bFinished) {
        return (await aPromise).value
      } else {
        yield (await aPromise).value
      }
      aPromise = gen1.next()
      aResolved = false
    }

    if (bResolved || aFinished) {
      if (aFinished && bFinished) {
        return (await bPromise).value
      } else {
        yield (await bPromise).value
      }
      bPromise = gen2.next()
      bResolved = false
    }
  }
})()

async function main() {
  for await (const msg of it2) {
    console.log(`msg`, msg)
  }
}

main()
