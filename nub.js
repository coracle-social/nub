function shareOnNostr(element, opts = {}) {
  let rejected = false
  let pubkey = localStorage.getItem('nub__pubkey')
  let username = localStorage.getItem('nub__username')

  const button = document.createElement('button')
  const text = document.createTextNode(opts.buttonText || "Share on Nostr")

  button.classList.add('nub__button')
  button.classList.add('nub-style__button')
  button.addEventListener('click', showModal)

  if (opts.buttonImage) {
    const image = document.createElement('img')

    image.src = opts.buttonImage
    image.classList.add('nub__button-image')

    button.append(image)
  }

  button.append(text)

  element.append(button)

  if (pubkey && !username) {
    fetchUsername()
  }

  function setPubkey(k) {
    pubkey = k
    localStorage.setItem('nub__pubkey', k)
  }

  function setUsername(n) {
    username = n
    localStorage.setItem('nub__username', n)
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

  function remove(selector) {
    const el = document.querySelector(selector)

    if (el) {
      el.remove()
    }
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
    const content = document.querySelector('.nub__modal-content')

    let template = {
      kind: opts.kind || 1,
      pubkey: pubkey,
      content: content.textContent,
      tags: [["r", window.location.href]],
      created_at: Math.floor(Date.now() / 1000),
    }

    if (opts.modifyTemplate) {
      template = opts.modifyTemplate(template)
    }

    template.id = await getEventHash(template)

    let resolved = false

    window.nostr.signEvent(template).then(function(event) {
      sendMessage(opts.publishRelay || 'wss://nostr.mutinywallet.com', ["EVENT", event], {
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

    backdrop.classList.add('nub__modal-backdrop')
    modal.classList.add('nub__modal-modal')
    padding.classList.add('nub__modal-padding')
    heading.classList.add('nub__modal-heading')
    heading.classList.add('nub-style__p')
    content.classList.add('nub__modal-content')
    content.classList.add('nub-style__p')

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
    content.textContent = opts.getContent()

    setTimeout(function() {
      backdrop.classList.add('nub__modal-active')
    })

    attemptLogin()
  }

  function attemptLogin() {
    if (pubkey) {
      remove('.nub__modal-login')
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
    remove('.nub__modal-account')

    const account = document.createElement('p')

    account.classList.add('nub__modal-account')
    account.classList.add('nub-style__p')
    account.textContent = "Posting as @" + (username || pubkey.slice(0, 8))

    document.querySelector('.nub__modal-modal').append(account)
  }

  function showConfirm() {
    remove('.nub__modal-confirm')

    const confirm = document.createElement('button')

    confirm.classList.add('nub__modal-confirm')
    confirm.classList.add('nub-style__button')
    confirm.textContent = opts.confirmText || "Share"

    confirm.addEventListener('click', function(e) {
      sendShare()
    })

    document.querySelector('.nub__modal-modal').append(confirm)
  }

  function showLogin() {
    remove('.nub__modal-login')

    const login = document.createElement('button')

    login.classList.add('nub__modal-login')
    login.classList.add('nub-style__button')
    login.textContent = opts.loginText || "Log In"

    login.addEventListener('click', function(e) {
      attemptLogin()
    })

    document.querySelector('.nub__modal-modal').append(login)
  }

  function hideModal() {
    const backdrop = document.querySelector('.nub__modal-backdrop')

    if (backdrop) {
      backdrop.classList.remove('nub__modal-active')

      setTimeout(function() {
        backdrop.remove()
      }, 300)
    }
  }
}
