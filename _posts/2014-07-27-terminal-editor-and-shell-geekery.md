---
layout: article
title: Terminal, Editor and Shell Geekery
tags: unix shell editor programming productivity dotfiles
---

It's been a busy few months and I am lucky to be learning lots through work and other projects, though somewhat failing to share interesting stuff here! Anyway, inspired by watching one of my friends use a computer almost exclusively sans mouse/trackpad, and by a [test-driven development](http://en.wikipedia.org/wiki/Test-driven_development) kata on which [Mark Withall](http://markwithall.com/) and I are working [I should make a separate post on this soon], I wanted to get more productive with my coding.

## Terminal

The first step was to move to [iTerm2](http://iterm2.com) which allows me to have a full-screen terminal window with three panes: a full-height left-hand one for code; a top-right one for revision control and a bottom-right one continually running tests in a loop.

![Coding kata screenshot with some omni completion occurring](/images/posts/2014-07-27-terminal-editor-and-shell-geekery/coding-kata-session.png)

I need rather large text, so there's a bit of a trade-off between pane widths, though I try to ensure they're all at least 80 by 25 characters if possible.

## Editor

I've been using Vim since my undergrad year in industry, where it made short work of manipulating large volumes of text-based data, but I've never really grokked it.  Recently I've cranked my [Vim](http://www.vim.org) config up to eleven using the excellent [Vundle](https://github.com/gmarik/Vundle.vim) and several plugins such as

 * [ropevim](https://github.com/python-rope/ropevim) for refactoring Python
 * [jedi-vim](https://github.com/davidhalter/jedi-vim) for autocompleting Python
 * [Syntastic](https://github.com/scrooloose/syntastic) for syntax checking
 * [Gundo](http://sjl.bitbucket.org/gundo.vim/) for unlocking the potential of Vim's undo history tree

and I'm looking forward to becoming proficient with these and more in due course!  When smoothly rocking along with Vim, it seems a good idea to thoroughly check out Emacs again in order to pick things up from a different perspective.

Some have asked why I don't move into the 21st century---maybe I should try some more modern editors, but for me (and it seems others) Vim still offers a clean, yet also helpful and productive development environment and I do enjoy its modal nature, keyboard-centricity, malleability and aesthetic.  Also I love that, whilst so many systems, platforms and hardware/software standards have come and gone, we can still rely on these trusty tools (along with serial ports, who still [KBO](http://www.urbandictionary.com/define.php?term=kbo&defid=2137593))---it's almost as if I'm a "real hacker", not just out of obsession with the supposed quaint or eccentric, but because these tools seriously deliver the goods.

## Shell

Another change I've made, with a helpful nudge from my colleague [Karl Groves](http://www.karlgroves.com) and [a presentation I read online](http://www.slideshare.net/jaguardesignstudio/why-zsh-is-cooler-than-your-shell-16194692), is to move to [zsh](http://www.zsh.org) from Bash (which taught me so much and I have enjoyed and relied on for many years).  There is a great distribution of configuration, themes and plugins for zsh called [oh-my-zsh](http://ohmyz.sh) but so far I've decided to roll my own config, drawing a lot from the examples there and in the manual and tutorials many others have written.  So far I'm really enjoying...

 * The even more awesome completion, including being able to expand paths (e.g. `/u/l/b` to `/usr/local/bin`).
 * The even more awesome globbing, including [recursive globbing, negation, approximate matching and qualifiers](http://www.refining-linux.org/archives/37/ZSH-Gem-2-Extended-globbing-and-expansion/).  (Also, check out the other [zsh gems](http://www.refining-linux.org/archives/2011/12.html) in that series.)
 * Dropping the `cd` and just issuing directory names to change to them---plus, the directory history stack.
 * Customising the autocompletion, other interfaces and my prompt, including using colour names instead of escape codes.

Whilst Bash is still awesome, I'm enjoying the way that zsh works---though all this exploration of shells has also lead me to discover [fish](http://fishshell.com), which sounds compelling (it has a sort-of "there's only one way to do it"/"it just works" [philosophy](http://fishshell.com/docs/current/design.html) and even includes syntax highlighting); when my zsh config has settled, I intend to explore fish, too.

## Powerline

I was blown away by the striking, yet simple and informative [agnoster theme for zsh](https://gist.github.com/agnoster/3712874) and wondered if those techniques and aesthetic could be applied elsewhere; eventually I discovered [Powerline](https://github.com/Lokaltog/powerline) (there are lighter-weight related projects, for those who are interested) and find it compelling---something to check out when my `.zshrc` et al a bit more solid...

## My Dotfiles GitHub Repo

Like many others (whom I've shamelessly copied in terms of repo structure) I have put my [dotfiles on GitHub](https://github.com/matatk/dotfiles) for easy set-up across boxen.  I have tried to document them (particularly the zsh and Vim stuff) and I hope you find something useful in there.
