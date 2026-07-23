---
layout: about
title: about
permalink: /
subtitle: "<b>Contact</b>: sizheli [at] mit [dot] edu"

profile:
  align: right
  image: prof_pic.jpg
  image_circular: false # crops the image to make it circular
  more_info:
    # >
    # <p>555 your office number</p>
    # <p>123 your address street</p>
    # <p>Your City, State 12345</p>

news: true # includes a list of news items
selected_papers: true # includes a list of papers marked as "selected={true}"
social: true # includes social icons at the bottom of the page
---

<div class="about-intro">
  <p class="about-lead">
    I am a PhD student in Computer Science at <a href="https://csail.mit.edu/" rel="external nofollow noopener" target="_blank">MIT CSAIL</a>, advised by
    <span id="advisor-order">
      <a href="https://www.vincentsitzmann.com/" rel="external nofollow noopener" target="_blank">Vincent Sitzmann</a> and
      <a href="http://web.mit.edu/cocosci/josh.html" rel="external nofollow noopener" target="_blank">Josh Tenenbaum</a>
    </span>. My research is supported by the
    <a href="https://oge.mit.edu/fellowships/presidential-graduate-fellowship-program/" rel="external nofollow noopener" target="_blank">MIT Presidential Fellowship</a>.
  </p>
</div>

<script>
  (function () {
    var advisorOrder = document.getElementById("advisor-order");
    if (!advisorOrder) return;

    var advisors = [
      { name: "Vincent Sitzmann", url: "https://www.vincentsitzmann.com/" },
      { name: "Josh Tenenbaum", url: "http://web.mit.edu/cocosci/josh.html" },
    ];
    if (Math.random() < 0.5) advisors.reverse();

    advisorOrder.textContent = "";
    advisors.forEach(function (advisor, index) {
      if (index > 0) advisorOrder.appendChild(document.createTextNode(" and "));

      var link = document.createElement("a");
      link.href = advisor.url;
      link.textContent = advisor.name;
      link.rel = "external nofollow noopener";
      link.target = "_blank";
      advisorOrder.appendChild(link);
    });
  })();
</script>

<div class="research-statement">
  <p><strong>Research Objectives.</strong> I build the brains and bodies of robots. My work draws on ideas from machine learning, physics, and cognitive AI, with applications in robotics, computer vision, and computer graphics.</p>

  <p>I study intelligent systems in a physics-inspired way, by which I don't mean injecting inductive biases, but rather building systems like a physicist seeking to understand the underlying mechanisms behind generalizations and behaviors.</p>
</div>

<!-- Write your biography here. Tell the world about yourself. Link to your favorite [subreddit](http://reddit.com). You can put a picture in, too. The code is already in, just name your picture `prof_pic.jpg` and put it in the `img/` folder.

Put your address / P.O. box / other info right below your picture. You can also disable any of these elements by editing `profile` property of the YAML header of your `_pages/about.md`. Edit `_bibliography/papers.bib` and Jekyll will render your [publications page](/al-folio/publications/) automatically.

Link to your social media connections, too. This theme is set up to use [Font Awesome icons](https://fontawesome.com/) and [Academicons](https://jpswalsh.github.io/academicons/), like the ones below. Add your Facebook, Twitter, LinkedIn, Google Scholar, or just disable all of them. -->
