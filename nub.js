function shareOnNostr(element, opts = {}) {
  let rejected = false
  let pubkey = localStorage.getItem('nostr-share__pubkey')
  let username = localStorage.getItem('nostr-share__username')

  const button = document.createElement('button')

  button.classList.add('nostr-share__button')
  button.classList.add('nostr-share-style__button')
  button.textContent = opts.buttonText || "Share"
  button.addEventListener('click', showModal)

  element.append(button)

  if (pubkey && !username) {
    fetchUsername()
  }

  function setPubkey(k) {
    pubkey = k
    localStorage.setItem('nostr-share__pubkey', k)
  }

  function setUsername(n) {
    username = n
    localStorage.setItem('nostr-share__username', n)
  }

  function getEventHash(e) {
    return sha256(JSON.stringify([0, e.pubkey, e.created_at, e.kind, e.tags, e.content]))
  }

  async function sha256(input) {
    const textAsBuffer = new TextEncoder().encode(input)
    const hashBuffer = await crypto.subtle.digest("SHA-256", textAsBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))

    return hashArray.map(item => item.toString(16).padStart(2, "0")).join("")
  }

  function sendMessage(url, message, {onMessage, onTimeout}) {
    const ws = new WebSocket(url)

    ws.onopen = function() {
      const filter = {kinds: [0], authors: [pubkey]}

      ws.send(JSON.stringify(message))
    }

    ws.onmessage = function(e) {
      try {
        const message = JSON.parse(e.data)

        if (Array.isArray(message)) {
          onMessage(ws, message)
        }
      } catch (e) {
        // pass
      }
    }

    setTimeout(function() {
      ws.close()
      onTimeout(ws)
    }, 30_000)
  }

  function fetchUsername(cb) {
    const filter = {kinds: [0], authors: [pubkey]}
    const req = ["REQ", "username", filter]

    let resolved = false

    sendMessage(opts.profileRelay || 'wss://purplepag.es', req, {
      onMessage: function (ws, message) {
        if (message[0] === 'EVENT') {
          const content = JSON.parse(message[2].content)

          setUsername(content.name || content.display_name)
          resolved = true

          if (cb) {
            cb()
          }
        }
      },
      onTimeout: function () {
        if (!resolved && cb) {
          cb()
        }
      },
    })
  }

  async function sendShare() {
    const template = {
      kind: 9802,
      pubkey: pubkey,
      content: opts.content,
      tags: [["r", window.location.href]],
      created_at: Math.floor(Date.now() / 1000),
    }

    template.id = await getEventHash(template)

    let resolved = false

    window.nostr.signEvent(template).then(function(event) {
      sendMessage(opts.publishRelay || 'wss://relay.damus.io', ["EVENT", event], {
        onMessage: function(ws, message) {
          if (message[0] === 'OK') {
            if (!message[2]) {
              alert("Failed to publish your event!")
            }

            resolved = true
            hideModal()
          }
        },
        onTimeout: function() {
          if (!resolved) {
            alert("Failed to publish your event!")
          }

          hideModal()
        },
      })
    })
  }

  function showModal() {
    const backdrop = document.createElement('div')
    const modal = document.createElement('div')
    const padding = document.createElement('div')
    const heading = document.createElement('p')
    const content = document.createElement('p')

    backdrop.classList.add('nostr-share__modal-backdrop')
    modal.classList.add('nostr-share__modal-modal')
    padding.classList.add('nostr-share__modal-padding')
    heading.classList.add('nostr-share__modal-heading')
    heading.classList.add('nostr-share-style__p')
    content.classList.add('nostr-share__modal-content')
    content.classList.add('nostr-share-style__p')

    backdrop.addEventListener('click', hideModal)
    modal.addEventListener('click', function(e) {
      e.stopPropagation()
    })

    document.body.append(backdrop)
    backdrop.append(modal)
    backdrop.append(padding)
    modal.append(heading)
    modal.append(content)
    heading.textContent = opts.headingText || "Share on Nostr"
    content.textContent = opts.content

    setTimeout(function() {
      backdrop.classList.add('nostr-share__modal-active')
    })

    attemptLogin()
  }

  function attemptLogin() {
    if (pubkey) {
      hideLogin()
      showAccount()
      showConfirm()
    } else if (rejected) {
      alert("Failed to login, please reload the page and try again.")
    } else if (window.nostr) {
      showLogin()

      window.nostr.getPublicKey().then(
        function (k) {
          setPubkey(k)

          fetchUsername(function() {
            attemptLogin()
          })
        },
        function (e) {
          rejected = true
        }
      )
    } else {
      alert("No nostr extension found, please install one and try again.")
    }
  }

  function showAccount() {
    const account = document.createElement('p')

    account.classList.add('nostr-share__modal-account')
    account.classList.add('nostr-share-style__p')
    account.textContent = "Posting as @" + (username || pubkey.slice(0, 8))

    document.querySelector('.nostr-share__modal-modal').append(account)
  }

  function showConfirm() {
    const confirm = document.createElement('button')

    confirm.classList.add('nostr-share__modal-confirm')
    confirm.classList.add('nostr-share-style__button')
    confirm.textContent = opts.confirmText || "Share"

    confirm.addEventListener('click', function(e) {
      sendShare()
    })

    document.querySelector('.nostr-share__modal-modal').append(confirm)
  }

  function showLogin() {
    if (!document.querySelector('.nostr-share__modal-login')) {
      const login = document.createElement('button')

      login.classList.add('nostr-share__modal-login')
      login.classList.add('nostr-share-style__button')
      login.textContent = opts.loginText || "Log In"

      login.addEventListener('click', function(e) {
        attemptLogin()
      })

      document.querySelector('.nostr-share__modal-modal').append(login)
    }
  }

  function hideLogin() {
    const login = document.querySelector('.nostr-share__modal-login')

    if (login) {
      login.remove()
    }
  }

  function hideModal() {
    const backdrop = document.querySelector('.nostr-share__modal-backdrop')

    if (backdrop) {
      backdrop.classList.remove('nostr-share__modal-active')

      setTimeout(function() {
        backdrop.remove()
      }, 300)
    }
  }
}
