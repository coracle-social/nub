# NUB

A share button for nostr. Allows you to easily set up a button that shares the given content as a kind 9802 highlight, with an `r` tag pointing to the current url.

Currently requires a NIP 07 extension to log in.

## Usage

See [example.html](./example.html) for a working example and [nub.coracle.social](https://nub.coracle.social) for a nice landing page.

Nub is fully themeable, you can either override the css provided, or include your own stylesheet.

To set up the button, call `shareOnNostr` with an element to append the button to as the first argument, and an options object as the second object.

Options:

- `kind` (optional) - the event kind to publish (default: 1)
- `getContent` (required) - a function that returns the content to share when the button is clicked
- `modifyTemplate` (optional) - a function that takes the event template and modifies it before publishing
- `buttonText` (optional) - the text to use for the share button (default: "Share on Nostr")
- `buttonImage` (optional) - an image url to use for the share button
- `headingText` (optional) - the text to use for the modal heading (default: "Share on Nostr")
- `confirmText` (optional) - the text to use for the confirm button (default: "Share on Nostr")
- `loginText` (optional) - the text to use for the log in button (default: "Log In")
- `profileRelay` (optional) - the relay to use for fetching the user profile (default: "wss://purplepag.es")
- `publishRelay` (optional) - the relay to use for publishing the user's note (default: "wss://relay.damus.io")
