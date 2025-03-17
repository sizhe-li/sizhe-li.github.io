---
layout: distill
title: "Rethinking Robot Modeling and Representations"
date: 2025-03-15
description: 'An overview of Neural Jacobian Field, an architecture that autonomously learns to represent, model, and control in general-purpose way.'

authors:
  - name: Sizhe Lester Li
    affiliations:
      name: MIT CSAIL
bibliography: blogs.bib
comments: true

---

{% quote %}
Was Du ererbt von Deinen Vätern hast, erwirb es, um es zu besitzen. (Goethe)
{% endquote %}


# Motivation
Conventional robots -- rigid links, discrete joints, and precise sensors -— are a historical artifact of control and planning approaches. **How can robots with diverse morphologies, mechanisms, and sensors be represented, modeled, and controlled in a general-purpose way?** Machine learning can enable imprecise, flexible, and unconventional robots to perform as effectively as traditional designs, paving the way for more affordable, adaptable, and mass-produced robots.

Achieving this vision requires new control and modeling algorithms that go beyond precise sensor feedback and idealized dynamics. Conventional methods struggle with bio-inspired and soft-rigid hybrid robots, which lack internal sensors and well-defined states. Further, standard definitions of robot actions, such as end-effector pose changes, may not capture the contact-rich and whole-body motions. Finally, general-purpose robot representation offers new perspectives on appendages and tool use, as scissors and hammers function without embedded sensors but can be considered extensions to the robot dynamics upon contacts.

These questions demand a multidisciplinary approach. Our research combines computational models (drawing chiefly on machine learning, computational perception, and physics) with unique perspetives from the design and fabrication of bio-inspired robots. Our model, Neural Jacobian Field, could inspire the development of general-purpose models of robot dynamics and the integration of vision, touch, and sound into a unified spatial representation of robotic systems.


(Work in progress; 03/16/2025, Lester Li)

<!-- ### Key Themes
- Self supervision
- Representation (Spatial, Compositional, Linearity, Local)
- Physics


# Introduction

Teaser GIF

Input-Output Behavior of Jacobian

# Tutorial 1 & 2 (Learning 2D Jacobian)

# Tutorial 2 & 3 (Controlling robots with 2D Jacobians)

# Tutorail 4 & 5 (Learning 3D Jacobian)

# Tutorail 5 & 6 (Controlling robots with 3D Jacobians)
- 2D control interface - simple imitation learning
- 2D control interface - flow policy
- 3D control interface -->






