# NUB

A share button for nostr. Allows you to easily set up a button that shares the given content as a kind 9802 highlight, with an `r` tag pointing to the current url.

Currently requires a NIP 07 extension to log in.

## Usage

See [index.html](./index.html) for a working example.

Nub is fully themeable, you can either override the css provided, or include your own stylesheet.

To set up the button, call `shareOnNostr` with an element to append the button to as the first argument, and an options object as the second object.

Options:

- `content` (required) - the content to share
- `buttonText` (optional) - the text to use for the share button
- `headingText` (optional) - the text to use for the modal heading
- `confirmText` (optional) - the text to use for the confirm button
- `loginText` (optional) - the text to use for the log in button
- `profileRelay` (optional) - the relay to use for fetching the user profile
- `publishRelay` (optional) - the relay to use for publishing the user's note
