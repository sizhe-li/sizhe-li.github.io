---
layout: distill
title: "Rethinking Robot Modeling and Representations"
date: 2025-03-15
description: "An overview of Neural Jacobian Field, an architecture that autonomously learns to represent, model, and control robots in a general-purpose way."

authors:
  - name: Sizhe Lester Li
    affiliations:
      name: MIT CSAIL
bibliography: blogs.bib
comments: true
---

<p style="margin-top: -0.5rem; margin-bottom: 1.5rem; font-size: 0.85rem; color: var(--global-text-color-light);">
  Advised by <a href="https://www.vincentsitzmann.com/">Vincent Sitzmann</a>, MIT CSAIL
</p>

{% quote %}
Was Du ererbt von Deinen Vätern hast, erwirb es, um es zu besitzen. (Goethe)
{% endquote %}

# TL;DR

We present a solution that learns a controllable 3D model of any robot, from vision alone. This includes robots that were previously intractable to model by experts. [[Code]](https://github.com/sizhe-li/neural-jacobian-field) [[Project Page]](https://sizhe-li.github.io/publication/neural_jacobian_field/) [[Video]](https://www.youtube.com/watch?v=dFZ1RvJMN7A)

# Motivation

Have you ever wondered why robots today are so costly? Why are they almost always made of rigidly jointed segments? What if I tell you that this is largely due to challenges in building digital models of these robots, rather than hardware challenges?

<div class="row l-body">
	<div class="col-sm">
	  <img class="img-fluid rounded z-depth-1" src="/assets/img/njf/allegro_cost.png">
   <figcaption style="text-align: center; margin-top: 10px; margin-bottom: 10px;"> Allegro Hand  </figcaption>
	</div>
	<div class="col-sm">
	  <img class="img-fluid rounded z-depth-1" src="/assets/img/njf/ur5_cost.png">
   <figcaption style="text-align: center; margin-top: 10px; margin-bottom: 10px;"> UR5 Arm </figcaption>
	</div>
	<div class="col-sm">
  <img class="img-fluid rounded z-depth-1" src="/assets/img/njf/shadow_hand_cost.png">
   <figcaption style="text-align: center; margin-top: 10px; margin-bottom: 10px"> Shadow Hand </figcaption>
  </div>
</div>

### What even is a robot anyways?

Let's take a step back and think about what a robot even is. Slapping a few motors on an IKEA Lamp with a Raspberry Pi, we have mechanical system that we can command to move around in space. Is that a robot? [(This turns out to be a rather difficult question)](https://cs.stanford.edu/people/eroberts/courses/soco/projects/1998-99/robotics/history.html). We would argue that if a machine is capable of solving the physical task you are interested in, then it is a valid robot.

<div class="row l-body">
  <div class="col-sm text-center">
    <img class="img-fluid rounded z-depth-1" 
         src="/assets/img/njf/ikea_robot.png" 
         style="width: 50%; display: block; margin: 0 auto;">
    <figcaption style="text-align: center; margin-top: 10px; margin-bottom: 10px;">
      <strong><a href="https://community.robotshop.com/forum/t/tertiarm-low-cost-3d-printed-robot-arm-based-on-ikea-lamp/7517">Tertiarm</a></strong>: Low cost, 3D printed, made of IKEA Lamp 
    </figcaption>
  </div>
</div>

### The minimum requirement -- the ability to control

Perhaps a valid definition of a robot includes a criterion of _controllability_. We need to be able to control the robot to call it one. That's why many people wouldn't call the motorized IKEA lamp a robot -- today we do not have an algorithm that can control it effectively. Next, we have a second robot -- a pneumatic hand (**left figure**) -- that shares the same property as our IKEA robot. Namely, today this robot is also not controllable.

The central question of control is: given a desired motion for my robot hand, what change of command should I send? (**right figure**)

<div class="row l-body">
	<div class="col-sm">
	  <img class="img-fluid rounded z-depth-1" src="/assets/img/njf/control_1.png">
   <figcaption style="text-align: center; margin-top: 10px; margin-bottom: 10px;"> $300 pneumatic hand at work </figcaption>
	</div>
	<div class="col-sm">
  <img class="img-fluid rounded z-depth-1" src="/assets/img/njf/control_2.png">
   <figcaption style="text-align: center; margin-top: 10px; margin-bottom: 10px"> <strong>Desired motions</strong>: arrows; <strong>Commands</strong>: blue air tubes </figcaption>
  </div>
</div>

Today, most robots look like the UR5 below. These robots inherit a special class of sensors and morphologies for making them controllable.

<!-- Because they need all these sensors to make them controllable -->

<!-- That's why most robots look like the UR5 arm or Allegro Hand shown above. Because they all need
Because they need all these sensors to make them controllable
The most basic requirement for a mechanical system to be robotic is our ability to control it. What does "ability to control" mean? Here is an example:
Consider a robot hand (**left figure**). The question of control is -- in order for my robot hand to create desired motions what change of command should I send? (**right figure**) -->

<div class="row l-body">
  <div class="col-sm text-center">
    <img class="img-fluid rounded z-depth-1" 
         src="/assets/img/njf/rigid_motivation.png"
         style="width: 85%; display: block; margin: 0 auto;">
    <figcaption style="text-align: center; margin-top: 10px; margin-bottom: 10px;">
      Conventional robots might have limited our algorithmic thinking
    </figcaption>
  </div>
</div>

### Why is the past solution no longer adequate

The way we have approached this problem in the past has reached a ceiling. It turns out that past solutions cannot model the robots above, since these robots lack sensory measurements and experience deformations.

This is a part of why robotic automation today remains costly. We have cheaper hardware designs that can still perform the same physical tasks, but the conventional software does not support these hardwares. As a result, our robots are often over-engineered to compensate the software limitations.

For mechanical systems like airplanes and trains, it makes sense to design special-purpose sensors that measure the almost exact states. These sensory measurements typically support a model that suits the problem domains. This is because the application domain for these control problem requires extreme modeling accuracy and reaction times.

However, _the conventional modeling spirit doesn't seem suitable for the coming age of general-purpose robotics_. It assumes that the environment and the robot are modeled separately. It assumes that scissors and screwdrivers arrive with internal sensors reporting their states. It assumes that robots and the world have a fixed form of morphology and physical properties.

### A new spirit forward

A new modeling spirit is needed for more accessible robotic automation. One that integrates recent advances in computational perception, with powerful tools from machine learning, mechanics, and control. One that lifts the modeling assumptions to a level suitable for general-purpose robotics. One that requires new algorithms that go beyond precise sensor feedback and idealized dynamics.

Achieving this vision carries values to our society. Imprecise, flexible, and unconventional robots<d-cite key="gealy2019quasidirectdrivelowcostcompliant"></d-cite> can perform as safely and effectively as traditional designs, paving the way for more affordable, adaptable, and mass-produced robots.

<div class="row l-body">
  <div class="col-sm text-center">
    <img class="img-fluid rounded z-depth-1" 
         src="/assets/img/njf/new_robot_motivation.png"
         style="width: 85%; display: block; margin: 0 auto;">
    <figcaption style="text-align: center; margin-top: 10px; margin-bottom: 10px;">
      Next-gen robots require a new algorithmic approach.
    </figcaption>
  </div>
</div>

# Jacobian Fields

Jacobian Fields is an approach that aims to address problems we posed above. The core idea is to spatialize the conventional end-effector Jacobian in robot dynamics, and compute a field of such operators in the Euclidean space. We encourage the readers to refer to Chapter 5 of Modern Robotics <d-cite key="lynch2017modern"></d-cite> for details on manipulator Jacobians.

<div class="row">
  <div class="col-sm">
    <video class="img-fluid z-depth-1" autoplay loop muted playsinline>
      <source src="/assets/img/publication_preview/jacobian_fields_teaser.mp4" type="video/mp4">
    </video>
    <figcaption style="text-align: center; margin-top: 10px;">
     <strong> Teaser Video </strong> 
    </figcaption>
  </div>
</div>

### The Body Jacobian

Consider a point $\mathbf{p}(\mathbf{q}) = [x(\mathbf{q}), y(\mathbf{q})]^\top$ attached to this 2D robot arm. A small perturbation $\delta \mathbf{q}$ of the joint configuration produces the first-order displacement

$$
\delta \mathbf{p}
\approx
\mathbf{J}_{\mathbf{p}}(\mathbf{q})\,\delta \mathbf{q},
\qquad
\mathbf{J}_{\mathbf{p}}(\mathbf{q})
:=
\frac{\partial \mathbf{p}(\mathbf{q})}{\partial \mathbf{q}}.
$$

The matrix $\mathbf{J}_{\mathbf{p}}(\mathbf{q})$ is the Jacobian associated with this particular point. For more formalism and details, please see [our appendix](#details-on-system-jacobian) on the system Jacobian.

<div class="row">
  <div class="col-sm">
    <video class="img-fluid rounded z-depth-1" autoplay loop muted playsinline>
      <source src="/assets/video/njf/two_finger/only_joint_1_moving.mp4" type="video/mp4">
    </video>
    <figcaption style="text-align: center; margin-top: 10px;">
      Only joint 1 moving
    </figcaption>
  </div>

  <div class="col-sm">
    <video controls class="img-fluid rounded z-depth-1" autoplay loop muted playsinline>
      <source src="/assets/video/njf/two_finger/only_joint_2_moving.mp4" type="video/mp4">
    </video>
    <figcaption style="text-align: center; margin-top: 10px;">
      Only joint 2 moving
    </figcaption>
  </div>
</div>

### Spatialization of the Jacobian

Instead of choosing only one point, such as an end effector, we assign a Jacobian to every point in space. This lifts the representation from reduced coordinates to Euclidean space and connects it naturally to perceptual measurements such as scene flow and optical flow.

Using the language of continuum mechanics<d-cite key="bonet1997nonlinear"></d-cite>, let $\Omega_{\bar{\mathbf{q}}}\subset\mathbb{R}^d$ denote the robot's spatial domain at a nominal state $\bar{\mathbf{q}}$, with $d\in\{2,3\}$. Define the one-step deformation map

$$
\Phi(\cdot\,;\bar{\mathbf{q}},\mathbf{u})
:
\Omega_{\bar{\mathbf{q}}}\to\mathbb{R}^d,
\qquad
\mathbf{x}\mapsto\mathbf{x}^{+}
=
\Phi(\mathbf{x};\bar{\mathbf{q}},\mathbf{u}),
$$

which maps a point at its current spatial coordinate $\mathbf{x}$ to its next position under command $\mathbf{u}$. Around a nominal command $\bar{\mathbf{u}}$, the motion caused by a small command perturbation $\delta\mathbf{u}$ is

$$
\begin{aligned}
\delta\mathbf{x}(\mathbf{x})
&:=
\Phi(\mathbf{x};\bar{\mathbf{q}},\bar{\mathbf{u}}+\delta\mathbf{u})
-
\Phi(\mathbf{x};\bar{\mathbf{q}},\bar{\mathbf{u}}) \\
&=
\mathbf{J}(\mathbf{x};\bar{\mathbf{q}},\bar{\mathbf{u}})\,\delta\mathbf{u}
+ o(\lVert\delta\mathbf{u}\rVert),
\end{aligned}
$$

with the pointwise Jacobian

$$
\mathbf{J}(\mathbf{x};\bar{\mathbf{q}},\bar{\mathbf{u}})
:=
\left.
\frac{\partial \Phi(\mathbf{x};\bar{\mathbf{q}},\mathbf{u})}
{\partial \mathbf{u}}
\right\rvert_{\mathbf{u}=\bar{\mathbf{u}}}
\in \mathbb{R}^{d\times n}.
$$

> The **Jacobian field** is the spatially indexed collection of these local linear maps: $\mathbf{x}\mapsto\mathbf{J}(\mathbf{x};\bar{\mathbf{q}},\bar{\mathbf{u}})$. At each point, it maps a small actuator-command perturbation $\delta\mathbf{u}$ to the point's first-order motion $\delta\mathbf{x}$.

### Learning and measuring Jacobian Fields from perceptual inputs

We now use a simple 2D example to illustrate the idea of Jacobian Fields. Please check out the pytorch implementation of [tutorial 1](https://github.com/sizhe-li/neural-jacobian-field/blob/main/notebooks/tutorial/1_training_pusher_jacobian_in_2D.ipynb) to reproduce our results in this section.

**2D Pusher Environment.** The environment contains a spherical robotic pusher. The robot can move freely in 2D space and is steered by a 2D velocity command $\delta u \triangleq (x, y)$, where $x, y \in \mathbb{R}$.

**Training Samples Illustration.** We now illustrate the two training samples in our dataset, moving down and to the right. The following same-row videos might become async due to HTML rendering.

<div class="row">
  <div class="col-sm">
    <video class="img-fluid rounded z-depth-1" autoplay loop muted playsinline>
      <source src="/assets/video/njf/tutorial1/move_down_rgb.mp4" type="video/mp4">
    </video>
    <figcaption style="text-align: center; margin-top: 10px;">
      Sample 1 RGB observation
    </figcaption>
  </div>

  <div class="col-sm">
    <video controls class="img-fluid rounded z-depth-1" autoplay loop muted playsinline>
      <source src="/assets/video/njf/tutorial1/move_down_optical_flow.mp4" type="video/mp4">
    </video>
    <figcaption style="text-align: center; margin-top: 10px;">
      Sample 1 optical flow
    </figcaption>
  </div>

  <div class="col-sm">
    <video controls class="img-fluid rounded z-depth-1" autoplay loop muted playsinline>
      <source src="/assets/video/njf/tutorial1/move_right_rgb.mp4" type="video/mp4">
    </video>
    <figcaption style="text-align: center; margin-top: 10px;">
      Sample 2 RGB observation
    </figcaption>
  </div>

  <div class="col-sm">
    <video controls class="img-fluid rounded z-depth-1" autoplay loop muted playsinline>
      <source src="/assets/video/njf/tutorial1/move_right_optical_flow.mp4" type="video/mp4">
    </video>
    <figcaption style="text-align: center; margin-top: 10px;">
      Sample 2 optical flow
    </figcaption>
  </div>
</div>

How can we learn Jacobian Fields from visual perception to explain the optical flow we observe? In this 2D example, the spatial domain is the image plane, so the motion $\delta\mathbf{x}$ can be measured directly as optical flow. In 3D scenes, this correspondence also involves camera projection, visibility, and occlusion.

We use a standard fully convolutional network (UNet<d-cite key="ronneberger2015unetconvolutionalnetworksbiomedical"></d-cite>) to infer an image-space Jacobian field $\mathbf{J}_\theta(\mathbf{x}\mid I)\in\mathbb{R}^{2\times n}$ from an image observation $I$. At every pixel $\mathbf{x}$, the network outputs a linear map from the $n$-dimensional command perturbation to a 2D motion vector.

Given a training tuple $(I,I^+,\delta\mathbf{u})$, we minimize the discrepancy between the motion predicted by the Jacobian field and the measured optical flow:

$$
\underset{\theta}{\operatorname{argmin}}
\sum_{\mathbf{x}\in\Omega}
\left\lVert
\mathbf{J}_\theta(\mathbf{x}\mid I)\,\delta\mathbf{u}
- \mathbf{V}(\mathbf{x}\mid I,I^+)
\right\rVert_2^2,
$$

where $\mathbf{V}$ is the optical flow field computed by a state-of-the-art approach such as RAFT<d-cite key="teed2020raftrecurrentallpairsfield"></d-cite>.

### Visualizing the learned Jacobian Fields

Training till convergence, using just two samples, our Jacobian Field is able to explain unseen image observations and command directions. We will soon delve deeper into the physics of why Jacobian Fields can generalize here. The short answers are **invariance, locality, and compositionality** of the Jacobians.

How are we visualizing the Jacobians? We simply assign color component to each channel of the Jacobian field. For every spatial coordinate, we compute the norm over spatial channel to derive the total spatial sensitivity vector of the Jacobian. Please check out the pytorch implementation of [tutorial 1](https://github.com/sizhe-li/neural-jacobian-field/blob/main/notebooks/tutorial/1_training_pusher_jacobian_in_2D.ipynb) to reproduce our results in this section.

<div class="row">
  <div class="col-sm">
    <video class="img-fluid rounded z-depth-1" autoplay loop muted playsinline>
      <source src="/assets/video/njf/tutorial1/rgb_1.mp4" type="video/mp4">
    </video>
    <figcaption style="text-align: center; margin-top: 10px;">
      RGB observation
    </figcaption>
  </div>

  <div class="col-sm">
    <video controls class="img-fluid rounded z-depth-1" autoplay loop muted playsinline>
      <source src="/assets/video/njf/tutorial1/gt_optical_flow_1.mp4" type="video/mp4">
    </video>
    <figcaption style="text-align: center; margin-top: 10px;">
      G.T. optical flow
    </figcaption>
  </div>

  <div class="col-sm">
    <video controls class="img-fluid rounded z-depth-1" autoplay loop muted playsinline>
      <source src="/assets/video/njf/tutorial1/pred_optical_flow_1.mp4" type="video/mp4">
    </video>
    <figcaption style="text-align: center; margin-top: 10px;">
      Pred. optical flow
    </figcaption>
  </div>

  <div class="col-sm">
    <video controls class="img-fluid rounded z-depth-1" autoplay loop muted playsinline>
      <source src="/assets/video/njf/tutorial1/pred_jacobian_q0_1.mp4" type="video/mp4">
    </video>
    <figcaption style="text-align: center; margin-top: 10px;">
      Jac. channel 1 (dx)
    </figcaption>
  </div>

  <div class="col-sm">
    <video controls class="img-fluid rounded z-depth-1" autoplay loop muted playsinline>
      <source src="/assets/video/njf/tutorial1/pred_jacobian_q1_1.mp4" type="video/mp4">
    </video>
    <figcaption style="text-align: center; margin-top: 10px;">
      Jac. channel 2 (dy)
    </figcaption>
  </div>
</div>

### A second example in 2D

Let's train our Jacobian Fields in another environment, but this time more compositional and dexterous! Please check out the pytorch implementation of [tutorial 2](https://github.com/sizhe-li/neural-jacobian-field/blob/main/notebooks/tutorial/2_training_finger_jacobian_in_2D.ipynb) to reproduce our results in this section.

**Finger Environment.** The environment contains a 2 degrees-of-freedom robot finger. The robot finger is commanded by a 2D joint velocity command $\delta u \triangleq (u_1, u_2)$, where $u_1, u_2 \in \mathbb{R}$ control the rotations of each motor respectively.

<div class="row">
  <div class="col-sm">
    <video class="img-fluid rounded z-depth-1" autoplay loop muted playsinline>
      <source src="/assets/video/njf/tutorial2/rgb_1.mp4" type="video/mp4">
    </video>
    <figcaption style="text-align: center; margin-top: 10px;">
      RGB observation
    </figcaption>
  </div>

  <div class="col-sm">
    <video controls class="img-fluid rounded z-depth-1" autoplay loop muted playsinline>
      <source src="/assets/video/njf/tutorial2/gt_optical_flow_1.mp4" type="video/mp4">
    </video>
    <figcaption style="text-align: center; margin-top: 10px;">
      G.T. optical flow
    </figcaption>
  </div>

  <div class="col-sm">
    <video controls class="img-fluid rounded z-depth-1" autoplay loop muted playsinline>
      <source src="/assets/video/njf/tutorial2/pred_optical_flow_1.mp4" type="video/mp4">
    </video>
    <figcaption style="text-align: center; margin-top: 10px;">
      Pred. optical flow
    </figcaption>
  </div>

  <div class="col-sm">
    <video controls class="img-fluid rounded z-depth-1" autoplay loop muted playsinline>
      <source src="/assets/video/njf/tutorial2/pred_jacobian_q0_1.mp4" type="video/mp4">
    </video>
    <figcaption style="text-align: center; margin-top: 10px;">
      Jac. channel 1 
    </figcaption>
  </div>

  <div class="col-sm">
    <video controls class="img-fluid rounded z-depth-1" autoplay loop muted playsinline>
      <source src="/assets/video/njf/tutorial2/pred_jacobian_q1_1.mp4" type="video/mp4">
    </video>
    <figcaption style="text-align: center; margin-top: 10px;">
      Jac. channel 2 
    </figcaption>
  </div>
</div>

The same idea successfully disentangles the different spatial components of motion.

### Unified representation with environment variables

The idea of Jacobian Fields extends to capture dynamics with environment variables, such as contacts with continuum bodies.

<figure style="display: flex; flex-direction: column; align-items: center;">
    <!-- <video width="70%" controls> -->
    <video controls class="img-fluid rounded z-depth-1" autoplay loop muted playsinline>
        <source src="/assets/video/njf/two_finger/control_example.mp4" type="video/mp4">
    </video>
    <figcaption style="margin-top: 8px; font-style: italic; text-align: center;">
      Control Illustration
    </figcaption>
</figure>

### Real-world examples

Remarkably, the same idea extends to the real world and to 3D. By incorporating the image formation model and neural rendering, we can use optical flows observed with 2D cameras to explain away the underlying flow field in the 3D world.

Here are a few examples, please check out the pytorch implementation of [tutorial 3](https://github.com/sizhe-li/neural-jacobian-field/blob/main/notebooks/real_world/1_visualize_jacobian_fields.ipynb) and [tutorial 4](https://github.com/sizhe-li/neural-jacobian-field/blob/main/notebooks/real_world/2_inverse_dynamics.ipynb) to reproduce our results in this section.

<div class="row">
  <div class="col-sm">
    <video class="img-fluid rounded z-depth-1" autoplay loop muted playsinline>
      <source src="/assets/video/njf/njf_allegro.mp4" type="video/mp4">
    </video>
    <figcaption style="text-align: center; margin-top: 10px;">
     <strong> Results on Allegro Hand.</strong> (Left) Input video, (Middle) Depth Prediction, (Right) Jacobian Prediction
    </figcaption>
  </div>
</div>

<div class="row">
  <div class="col-sm">
    <video class="img-fluid rounded z-depth-1" autoplay loop muted playsinline>
      <source src="/assets/video/njf/njf_pneumatic.mp4" type="video/mp4">
    </video>
    <figcaption style="text-align: center; margin-top: 10px;">
     <strong>Results on Pneumatic Hand.</strong> (Left) Input Image, (Middle) Depth Prediction, (Right) Jacobian Prediction
    </figcaption>
  </div>
</div>

### Controlling the robot with Jacobian Fields

After training, Jacobian Fields can be used for inverse dynamics. We have new upcoming results showing that a flow planner can be flexibly integrated into the approach, stay tuned!

For now, let's illustrate the idea by just using a keypoint trajectory and a model-predictive controller.

<div class="row">

  <div class="col-sm">
    <img src="/assets/video/njf/inverse_dynamics/desired_motion.png" 
         class="img-fluid rounded z-depth-1" 
         alt="Results on Pneumatic Hand">
    <figcaption style="text-align: center; margin-top: 10px;">
      Desired Motions
    </figcaption>
  </div>

  <div class="col-sm">
    <video class="img-fluid rounded z-depth-1" autoplay loop muted playsinline>
      <source src="/assets/video/njf/inverse_dynamics/optim_process.mp4" type="video/mp4">
    </video>
    <figcaption style="text-align: center; margin-top: 10px;">
      Optimization
    </figcaption>
  </div>

  <div class="col-sm">
    <img src="/assets/video/njf/inverse_dynamics/output_command.png" 
      style="height: 162px; object-fit: cover;" 
         class="img-fluid rounded z-depth-1" 
         alt="Results on Pneumatic Hand">
    <figcaption style="text-align: center; margin-top: 10px;">
      Output Command
    </figcaption>
  </div>

</div>

# Connections with invariance, locality, and compositionality

### 1. Linearity from Local Theory of Smoothing<d-cite key="pang2023globalplanningcontactrichmanipulation"></d-cite>

We model _differential_ kinematics by linearizing the system dynamics, which represents 3D motion fields induced by small control commands $\delta u$. In this regime, it is well-known that the 3D motion $\delta x$ of robot 3D points can be described by the space Jacobian and is thus a linear function of control commands, i.e. $\alpha \delta x = \frac{\partial f}{\partial u} (\alpha \delta u)$.

This is powerful, as completely specifying the system dynamics for a particular configuration $u'$ requires only $n \times 3$ linearly independent observations of pairs of control commands and induced scene flow, as this fully constrains the space Jacobian for a given configuration for a system with $n$ control channels.

For instance, one need not observe the motions for _both_ $-\delta u$ and $\alpha \delta u$; it suffices to observe _one_ of them. Similarly, one need not observe $\delta u$ and a scalar multiple $\alpha \delta u$; again, one of them in the training set suffices. This is in stark contrast to parameterizing $f$ as a neural network that directly predicts scene flow given an image and a robot command since the neural network _does not_ model these symmetries and will thus require orders of magnitude more motion observations to adequately model the system dynamics.

### 2. Spatial Locality of Mechanical Systems

Robot commands often result in highly localized spatial motion. Consider the two finger example we experiment with above, within a "rigid" segment, the Jacobian tensors are locally smooth as we spatially perturb the coordinate value.

### 3. Spatial Compositionality of Mechanical Systems

Robot commands often result in spatial motions composed by the influences of individual command channels. The two linkage robot finger we experiment with above is a great example. For a point inside the second segment, its motion is the integral over individual command channels in the Jacobian tensor field. Indeed, our predicted 2D motion is the summation over two Jacobian channels.

<!-- # Connections with Spatial and Physical Intelligence, and Cognitive Science
We see in order to move and we move in order to see. We are interested in building AI systems that learn from self-play and do not require special human-in-the-loop data annotations.  -->

### Project Website

For more information about our project, please check out our [project website](https://sizhe-li.github.io/publication/neural_jacobian_field/). Feel free to email [sizheli@mit.edu]() or create an issue on our GitHub repo for any questions!

### Related Works

For a comprehensive discussion of related works, please refer to Section 6 of our [Nature paper](https://doi.org/10.1038/s41586-025-09170-0).

### Acknowledgement

Sizhe Lester Li is presenting on behalf of the team in the 2025 paper "Controlling diverse robots by inferring Jacobian fields with deep networks." We would like to thank Isabella Yu for the visualizations of two-finger Jacobian Fields.

### Bibtex

If you find this blog helpful, please consider citing our work

```
@Article{Li2025,
author={Li, Sizhe Lester
and Zhang, Annan
and Chen, Boyuan
and Matusik, Hanna
and Liu, Chao
and Rus, Daniela
and Sitzmann, Vincent},
title={Controlling diverse robots by inferring Jacobian fields with deep networks},
journal={Nature},
year={2025},
month={Jun},
day={25},
issn={1476-4687},
doi={10.1038/s41586-025-09170-0},
url={https://doi.org/10.1038/s41586-025-09170-0}
}
```

### Details on System Jacobian

We first derive the conventional system Jacobian<d-cite key="pang2023globalplanningcontactrichmanipulation"></d-cite>. Consider a dynamical system with state $\mathbf{q} \in \mathbb{R}^{m}$, input command $\mathbf{u} \in \mathbb{R}^{n}$, and dynamics $\mathbf{f}: \mathbb{R}^{m} \times \mathbb{R}^{n} \mapsto \mathbb{R}^{m}$. Upon reaching a steady state, the state of the next timestep $\mathbf{q}^{+}$, is given by

$$
\begin{equation}
    \mathbf{q}^{+} = \mathbf{f}(\mathbf{q}, \mathbf{u}).
\end{equation}
$$

Holding the current state fixed at $\bar{\mathbf{q}}$, we perturb the nominal command $\bar{\mathbf{u}}$ by $\delta\mathbf{u}$. A first-order expansion in the command gives

$$
\mathbf{f}(\bar{\mathbf{q}},\bar{\mathbf{u}}+\delta\mathbf{u})
\approx
\mathbf{f}(\bar{\mathbf{q}},\bar{\mathbf{u}})
+
\left.
\frac{\partial\mathbf{f}(\bar{\mathbf{q}},\mathbf{u})}
{\partial\mathbf{u}}
\right\rvert_{\mathbf{u}=\bar{\mathbf{u}}}
\delta\mathbf{u}.
$$

Define the system Jacobian at the nominal operating point as

$$
\mathbf{J}_{\mathrm{sys}}(\bar{\mathbf{q}},\bar{\mathbf{u}})
:=
\left.
\frac{\partial\mathbf{f}(\bar{\mathbf{q}},\mathbf{u})}
{\partial\mathbf{u}}
\right\rvert_{\mathbf{u}=\bar{\mathbf{u}}}.
$$

This matrix maps a small command perturbation to the first-order change in the next state. If both the state and command are perturbed, the full linearization also contains the term $\frac{\partial\mathbf{f}}{\partial\mathbf{q}}\delta\mathbf{q}$.

Conventionally, modeling a robotic system involves experts designing a state vector $\mathbf{q}$ that completely defines the robot state, and then embedding sensors to measure each of these state variables. For example, the piece-wise-rigid morphology of conventional robotic systems means that the set of all joint angles is a full state description, and these are conventionally measured by an angular sensor in each joint.

However, these design decisions are difficult to apply to soft robots, and more broadly, to mechanical systems whose coordinates cannot be well-defined or sensorized. Here are a few examples

- **Soft and Bio-inspired Robots.** Instead of discrete joints, large parts of the robot might deform. Embedding sensors to measure the continuous state of a deformable system is difficult, both because there is no canonical choice for sensors universally compatible with different robots and because their placement and installation are challenging.
- **Designing the state itself is challenging.** In contrast to a piece-wise rigid robot, where the state vector can be a finite-dimensional concatenation of joint angles, the state of a deformable robot is infinite-dimensional due to continuous deformations.
- **Contacts, appendages, wear-and-tear can alter the "coordinate system."** Grasping on a screwdriver, the notion of the robotic system extends to the appendage. From an engineering standpoint, it is a bit odd to expect that screwdrivers and scissors arrive with sensors reporting their internal states.
- **Multi-sensory integration requires spatialization.** Perceptual signals -- visual, tactile, or auditory -- reveal the same reality of the physical world precisely in the spatial sense. Traditional expert-designed coordinate systems, hand-crafted on a per-robot basis, do not directly present a general solution to integrating different sensory measurements.
