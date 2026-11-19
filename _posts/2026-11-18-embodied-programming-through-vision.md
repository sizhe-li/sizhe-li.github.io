---
layout: distill
title: "Embodied Programming Through Vision"
date: 2026-11-18
description: "Embodied programming will transform robotics in the coming decade"
tags: [robot learning, video models]
categories: [talks]
related_posts: false

authors:
  - name: Sizhe Lester Li
    affiliations:
      name: MIT CSAIL
bibliography: blogs.bib
---

<link rel="stylesheet" href="{{ '/assets/css/posts/embodied-programming.css' | relative_url | bust_file_cache }}">

Today I gave a talk at Brown's Carney Institute for Brain Science called _Embodied Programming Through Vision_. Thank you to everyone who came, and to Carney for hosting me. This post is a written version of the talk.

# TL;DR

Robots can learn how their own bodies move from vision alone, by watching themselves execute random commands. A video model can plan what should happen in the world, and a learned body program turns that plan into commands for one particular robot. The planner never needs to know any robot's action coordinates. That is why I think embodiment generalization need not be a distinct learning problem.

Prologue
{: .ep-act}

# Is this a robot?

Put a few motors on a desk lamp and you get a machine you can command. Is it a robot? My intuition is that it counts if we can control it to do different things. (I wrote more about this question in [an earlier post](/blog/2025/jacobian-fields-tutorial/).)

{% capture ep_caps %}An ordinary IKEA desk lamp.|<a href="https://hackaday.io/project/19235-tertiarm-3d-printed-robot-arm">Tertiarm</a>, a hobbyist's robot arm built from an IKEA lamp. Would you call it a robot?{% endcapture %}
{::nomarkdown}
{% include posts/embodied-programming/gallery.html reveal=true kicker="Lamp, or robot?" items="img::robot_lamp.webp::A desk lamp;;img::robot_tertiarm.webp::A lamp with motors" aspect="1/1" captions=ep_caps alt="An IKEA desk lamp, and a robot arm built from an IKEA lamp" %}
{:/nomarkdown}

The question keeps coming up because robots no longer look like the rigid systems in textbooks. New manufacturing techniques enable new kinds of robots. The hand below has tendons and pressure-sensing fingertips, combines soft and rigid materials in one structure, and is 3D printed in one go by a single machine.

{::nomarkdown}
{% include posts/embodied-programming/gallery.html items="vid::mfg_operating.mp4::A printed hand with tendons;;vid::mfg_rendering.mp4::Soft and rigid materials in one structure;;vid::mfg_printing.mp4::Printed in one go" aspect="1/1" dark=true alt="A 3D-printed hand with tendons, a rendering of its soft and rigid parts, and the printing process" credit='Vision-controlled jetting: Buchner et al., <a href="https://www.nature.com/articles/s41586-023-06684-3">Nature 2023</a> (ETH Zurich, Inkbit, MIT).' %}
{:/nomarkdown}

The pneumatic hand we worked with is also printed directly, from several materials and without assembly. It costs about 300 dollars to print<d-cite key="matusik2024pneumatic"></d-cite>, and once it is printed, we can mount it on a robot arm.

{::nomarkdown}
{% include posts/embodied-programming/gallery.html items="img::pneumatic_printed.webp::Printed directly, without assembly::::::800/412;;img::pneumatic_on_arm.webp::On a robot arm::::::700/933" template="2.59fr 1fr" alt="The pneumatic hand: its design, the printed hand, and the hand mounted on a robot arm" %}
{:/nomarkdown}

There was just one problem: we had no good way to control it. Controlling a robot means that, given a desired motion in space, such as pinching the index finger and the thumb, we find the commands that produce it. For this hand, that is how much air pressure to put in each tube.

{% capture ep_caps %}The 3D-printed pneumatic hand, mounted on a robot arm.|A desired motion in space: pinch the index finger and the thumb (the arrows).|The commands that produce it: how much air pressure goes into each tube.{% endcapture %}
{::nomarkdown}
{% include posts/embodied-programming/stepper.html name="control-question" count=3 aspect="4/3" kicker="What control means here" captions=ep_caps alt="The pneumatic hand on a robot arm, then the desired motion drawn as arrows on the fingers, then the air tubes that carry the commands" caption="Desired motions (arrows) and the commands that produce them (the air tubes)." %}
{:/nomarkdown}

Conventional robots avoid this problem by design. A Shadow Hand costs 150,000 to 200,000 dollars, and a UR5 arm over 30,000. They are expensive because conventional control needs precise sensors and motors in every joint, and very precise manufacturing. The controller infers the robot's configuration from those joint sensors alone. It is like closing your eyes and guessing where your body is from muscle signals.

{% capture ep_caps %}A Shadow Hand and a UR5 arm, next to the printed hand.|Inside a UR5 joint: a precise motor and sensor.|Rigid links, with a sensor at every joint (A to F).{% endcapture %}
{::nomarkdown}
{% include posts/embodied-programming/stepper.html name="conventional" count=3 aspect="1400/681" kicker="Conventional robots, click by click" captions=ep_caps alt="A Shadow Hand and a UR5 arm with their prices, the inside of a UR5 actuator, and a rigid arm with a sensor at each joint" caption="Conventional robots are designed to make their modeling and control easy." %}
{:/nomarkdown}

People, in contrast, are capable embodied programmers. We can learn to teleoperate a new robot within minutes, and the only sensors we need are our eyes. From vision alone, we build a model of the robot and predict how our commands will move it.

{::nomarkdown}
{% include posts/embodied-programming/gallery.html items="vid::teleop_losey.mp4::Teleoperating an assistive arm with a joystick;;vid::teleop_pneumatic.mp4::Teleoperating the printed hand" cols=2 aspect="16/9" cover=true alt="People teleoperating a robot arm with a joystick, and teleoperating the pneumatic hand" credit='Left: Losey et al., <a href="https://arxiv.org/abs/2107.02907">Autonomous Robots 2022</a>. Right: Matusik et al., ICRA 2024.' %}
{:/nomarkdown}

Act I
{: .ep-act}

# Learning a body from vision

How have people tried to give robots this ability? Physics-based models need an expert to write down the geometry, the material properties, and simplifying assumptions, such as a backbone with constant curvature<d-cite key="dellasantina2023softcontrol"></d-cite>. Sensors and markers need the body to be instrumented, with sensors built into it or markers tracked by motion capture<d-cite key="truby2020proprioception"></d-cite>. Visual self-models learn the robot's shape from cameras, but they take measured joint angles as input, so they still assume precise encoders<d-cite key="chen2022selfmodel"></d-cite>. The printed hand has no joint sensors, and its soft materials are hard to model by hand. We wanted something that needs vision alone.

{::nomarkdown}
{% include posts/embodied-programming/approaches.html %}
{:/nomarkdown}

Neural Jacobian Fields<d-cite key="li2025njf"></d-cite> need only vision: one image in, 3D motion out. From a single camera image, a network predicts a Jacobian field. For every 3D point, the field is a linear map from a small change in the command to the motion of that point:

$$
\delta \mathbf{x} = \mathbf{J}(\mathbf{x}, I)\,\delta \mathbf{u}.
$$

{% capture ep_caps %}The input is a single camera image.|The output is a Jacobian field. Each color marks the part of the body that one command moves.|So for any command, it predicts how every point on the robot moves in 3D.{% endcapture %}
{::nomarkdown}
{% include posts/embodied-programming/gallery.html reveal=true arrows=true kicker="One image in, 3D motion out" items="img::past_njf.webp::Input: a single image;;vid::njf_overview_jacobian.mp4::Jacobian field::::t;;vid::njf_overview_motion.mp4::Predicted 3D motion::::c" aspect="4/3" captions=ep_caps alt="A single image of the pneumatic hand, the Jacobian field predicted from it, and the 3D motion it predicts for a command" %}
{:/nomarkdown}

The forward pass below makes this concrete: take a few points on the robot's surface and a command, and the Jacobian field gives the 3D motion of those points. Each command moves its own part of the body. In the second figure, the field is predicted from one image of the pneumatic hand. Pick a command to see the motion it predicts.

{% capture ep_caps %}From a single image, a neural network reconstructs a 3D Jacobian field.|Take a few points on the robot's surface.|Now take a robot command.|The Jacobian field maps the command to the 3D motion of those points.{% endcapture %}
{::nomarkdown}
{% include posts/embodied-programming/stepper.html name="forward-pass" count=4 aspect="1400/1020" kicker="The forward pass, click by click" captions=ep_caps alt="The forward pass of the Jacobian field: an image is turned into a Jacobian field, which maps a robot command to the 3D motion of points on the robot" caption="The forward pass of the Jacobian field. It plays on its own; click it, or use the arrow keys, to step through by hand." %}
{:/nomarkdown}

{::nomarkdown}
{% include posts/embodied-programming/commands.html %}
{:/nomarkdown}

### Training from random commands

Training needs no kinematic model and no demonstrations. We send random commands and film the robot with a few cameras. The model only watches how the robot looks and how it moves. After training, one camera is enough.

{::nomarkdown}
{% include posts/embodied-programming/gallery.html items="vid::njf_regime_views.mp4::Multi-view observations;;cmds::::Random commands;;vid::njf_regime_jacobian.mp4::Learned Jacobian field::::t" aspect="640/528" kicker="Training regime" alt="Multi-view video of the robot under random commands, and the learned Jacobian field" %}
{:/nomarkdown}

The training objective uses only those recordings. From a single image, the network reconstructs a Jacobian field and a radiance field. Given the command, the Jacobian field gives a 3D motion field. We volume-render both fields into a camera, and supervise the renders with the images and with the optical flow between two consecutive frames.

{% capture ep_caps %}Start from a sequence of random control inputs.|Take two consecutive time steps.|At both, several cameras see the robot.|Take each camera in turn.|For each camera, we compute the optical flow between its two images.|Now take a single image.|From it, a network reconstructs a Jacobian field and a radiance field.|Given the command, the Jacobian field gives a 3D motion field.|We volume-render both fields into a camera.|And we supervise the renders with the RGB images and the optical flow.{% endcapture %}
{::nomarkdown}
{% include posts/embodied-programming/stepper.html name="training" count=10 aspect="1400/818" kicker="The training objective, click by click" captions=ep_caps alt="The training objective: random commands, multi-view video and optical flow supervise a Jacobian field and a radiance field through volume rendering" caption="Training with random commands and multi-view video. Rendered color and motion are supervised by the images and by optical flow." %}
{:/nomarkdown}

Why render at all? If we give the model depth as input and drop the rendering, its flow error is 7.5 times higher, and its Jacobians blend several actuators together. Our explanation is that without rendering into the other cameras, it gets no multi-view supervision.

{::nomarkdown}
{% include posts/embodied-programming/gallery.html items="img::njf_render_ablation.webp::::::::1400/851" zoom=true alt="Ablation: predicted flow and Jacobians with and without neural rendering, on six held-out images" caption="Without rendering, the flow error is 7.5 times higher (1.161 vs. 0.155 pixels on the pneumatic hand). Red boxes: its Jacobians blend several actuators together. From the Supplementary Information of the Nature paper (Table 2 and Fig. 3)." %}
{:/nomarkdown}

And why predict a Jacobian, rather than the motion directly? With the same data and backbone, a model that predicts motion directly still fits the training data but falls apart on new commands. In simulation, its error on unseen commands is 26 to 57 times higher. On the real Allegro hand, its predicted motion smears across the whole hand.

<div class="row l-body ep-hold" style="--ep-hold: 1800 / 829">
  <div class="col-sm">
    {% include figure.liquid path="assets/img/embodied-programming/njf_direct_flow_baseline.jpg" class="img-fluid rounded z-depth-1" zoomable=true caption="A model that predicts motion directly, compared with the Jacobian field, on held-out samples of the real Allegro hand." %}
  </div>
</div>

### Different bodies, the same visual interface

We tested the same recipe on very different bodies: the 3D-printed pneumatic hand, the 16-DoF Allegro hand, a soft, compliant wrist made of handed shearing auxetics (HSA), and a low-cost 3D-printed arm. Each one learns its own Jacobian field from its own experience. For every body, the model recovers the 3D shape and the kinematic structure from vision alone.

{::nomarkdown}
{% include posts/embodied-programming/bodies.html %}
{:/nomarkdown}

### Control

With a Jacobian field, control becomes an optimization. We specify the motion we want, in 2D or 3D, and solve for the command whose predicted motion matches it. Gradient-based optimization finds that command in about half a second. The second figure below shows the optimization running on the pneumatic hand.

{% capture ep_caps %}Start from the Jacobian field of the current image.|Specify the motion we want, in 2D or 3D. Gradient-based optimization finds the command whose predicted motion matches it, in about half a second.|Executing that command on the robot produces the motion.{% endcapture %}
{::nomarkdown}
{% include posts/embodied-programming/stepper.html name="control" count=3 aspect="1400/1100" kicker="From desired motion to a command" captions=ep_caps alt="A desired motion becomes a control objective: gradient-based optimization finds the command, which is then executed on the robot" caption="A desired motion becomes a control objective." %}
{:/nomarkdown}

<div class="row l-body">
  <div class="col-sm">
    <img src="/assets/video/njf/inverse_dynamics/desired_motion.png" class="img-fluid rounded z-depth-1" alt="Desired motion on the pneumatic hand">
    <figcaption class="caption">Desired motion</figcaption>
  </div>
  <div class="col-sm">
    <video class="img-fluid rounded z-depth-1" autoplay loop muted playsinline>
      <source src="/assets/video/njf/inverse_dynamics/optim_process.mp4" type="video/mp4">
    </video>
    <figcaption class="caption">Optimization</figcaption>
  </div>
  <div class="col-sm">
    <img src="/assets/video/njf/inverse_dynamics/output_command.png" class="img-fluid rounded z-depth-1" style="height: 162px; object-fit: cover;" alt="The command found by the optimization">
    <figcaption class="caption">Output command</figcaption>
  </div>
</div>

For longer motions, we close the loop. At every step, the robot looks at the current image, solves for a small command toward the next waypoint, executes it, and looks again.

{% capture ep_caps %}The low-cost arm draws a square in four segments. White is the reference trajectory, color is the completed motion.|In each segment, the distance to the target drops to a few millimeters.{% endcapture %}
{::nomarkdown}
{% include posts/embodied-programming/stepper.html name="tracking" count=2 aspect="1400/682" kicker="Closed-loop tracking" captions=ep_caps alt="Closed-loop trajectory tracking: the arm draws a square in four segments, and each segment ends within 8 mm of its target" caption="Closed-loop tracking of a square, from Fig. 4e of the Nature paper." %}
{:/nomarkdown}

The same recipe works on very different bodies. The pneumatic hand closes its fingers while part of it is hidden behind objects. The low-cost arm traces the letter M in the air. The soft wrist rotates while carrying a 350 g load: the load tilts it at rest, and the visual feedback still drives it to its goal, about 7 mm from the target.

{::nomarkdown}
{% include posts/embodied-programming/results.html %}
{:/nomarkdown}

{::nomarkdown}
{% include posts/embodied-programming/gallery.html items="img::hsa_load_feedback.webp::::::::1029/740" zoom=true alt="Distance to the target over time for the soft wrist under a 350 g load, with three frames from the run" caption="Visual feedback reduces the waypoint error. One experiment, from Fig. 4b of the Nature paper: the distance falls to 7.3 mm. The dashed baseline is a fixed reference position." %}
{:/nomarkdown}

Since each body learns its own model from its own experience, the hardware no longer has to be designed around our ability to model it by hand.

Turning point
{: .ep-act .ep-act--turn}

# A Jacobian field is a body program

Step back from the details, and the Jacobian field does one job: it turns a motion plan, what should move where in the image, into the commands that one particular body needs to produce it. I call this a _body program_. Each body learns its own from its own experience, and nothing above it needs to know that body's actuators.

That changes how I think about the whole problem. Control splits into two levels. At the low level, each body has its own body program. At the high level, a planning program decides what should happen in the world. The two meet in a language every body shares: motion, as a camera sees it. So far the motion plan came from us, because there was no planner. The rest of this post is about learning that level too.

{% capture ep_caps %}For each body, a Jacobian field turns a motion plan into that body's commands.|I call that a body program. It takes what the camera sees and a motion plan, and returns actuator commands. Each body learns its own.|But where does the motion plan come from? So far, from us: there was no planner.|Next, we learn that level too. A planning program takes an instruction and proposes the motion.{% endcapture %}
{::nomarkdown}
{% include posts/embodied-programming/stepper.html name="body-program" count=4 aspect="1400/615" kicker="Two levels, click by click" captions=ep_caps alt="A two-level picture: planning programs at the high level, shared across bodies, and one learned body program per body at the low level" caption="Body programs at the low level, one per body, below a shared planner." %}
{:/nomarkdown}

Act II
{: .ep-act}

# Planning in video

VERA<d-cite key="li2026vera"></d-cite> is a visual planning program. It plans in video, acts through a body program, and replans from what the cameras see.

{% capture ep_caps %}Given a language instruction and the current observations, a video model generates a video plan.|A body program, our Jacobian inverse dynamics model (J-IDM), turns each pair of planned frames into an action.|The robot executes the first few actions, observes what happened, and plans again.{% endcapture %}
{::nomarkdown}
{% include posts/embodied-programming/stepper.html name="vera-loop" count=3 aspect="1400/569" kicker="VERA, click by click" captions=ep_caps alt="VERA: a video world model generates visual futures from a text prompt and observations, a Jacobian inverse dynamics model turns them into actions, and execution feeds back new observations" caption="VERA plans in video, acts through a body program, and closes the loop." %}
{:/nomarkdown}

The planner is [Wan](https://arxiv.org/abs/2503.20314), a pretrained 14-billion-parameter video diffusion transformer. We did not change its architecture. Camera views are tiled into one wide frame, and we post-train the model on robot videos from [DROID](https://arxiv.org/abs/2403.12945), only to predict future frames. There is no action head. Actions come from the body program.

{::nomarkdown}
{% include posts/embodied-programming/gallery.html items="img::droid_setup.webp::::::::811/616;;img::droid_scenes.webp::::::::1000/722" template="1.317fr 1.385fr" alt="The DROID data collection setup, and a grid of scenes from the dataset" caption="DROID, a diverse robot manipulation dataset: 76k demonstration trajectories, or 350 hours of interaction data. Left: the data collection setup. Right: some of its scenes. Images from Khazatsky et al., 2024." %}
{:/nomarkdown}

The instruction decides which plan the model generates. Pick one below: the observed frames stay the same, and only the words change.

{::nomarkdown}
{% include posts/embodied-programming/planner.html %}
{:/nomarkdown}

The body program starts from VGGT<d-cite key="wang2025vggt"></d-cite>, a pretrained multi-view geometry transformer. We remove its geometry heads and add a Jacobian head that predicts, for every pixel, how each command channel moves that pixel. We train it like NJF, from known commands and observed optical flow, but in 2D pixels and without rendering. At test time we invert it: the planned pixel motion goes in, and a command comes out.

{::nomarkdown}
{% include posts/embodied-programming/jacobian.html %}
{:/nomarkdown}

Why start from a pretrained video model? Internet video already teaches a lot about motion and interaction. When we trained the planner from scratch on the same robot videos, its held-out prediction error was 3 times higher (0.40 vs. 0.13). One way to picture this, borrowing from Neural Thickets<d-cite key="gan2026thickets"></d-cite>, is below. The picture is an analogy, not something we measured.

{% capture ep_caps %}Internet video already teaches a lot about motion and interaction.|Many robot behaviors sit close to the pretrained weights.|Post-training on robot video is a short step toward them.{% endcapture %}
{::nomarkdown}
{% include posts/embodied-programming/stepper.html name="thicket" count=3 aspect="1400/1252" max="500px" kicker="An analogy" captions=ep_caps alt="A schematic of weight space: regions of robot behaviors sit around the pretrained video model, and post-training takes a short step toward them" caption="Robot behaviors near the pretrained weights. An analogy, after Neural Thickets." %}
{:/nomarkdown}

What does post-training keep? In our tests, the planner kept working with new camera viewpoints, new object arrangements, camera-angle changes, and lighting changes. These are examples, not a controlled comparison. My intuition is that we adapt behavior on top of a broad visual foundation, instead of learning each situation from scratch.

{::nomarkdown}
{% include posts/embodied-programming/gallery.html items="img::keep_viewpoints.webp::Camera viewpoints;;img::keep_configs.webp::Starting object configurations;;img::keep_angle.webp::Camera-angle changes;;img::keep_lighting.webp::Lighting changes" cols=4 aspect="4/3" cover=true alt="Four kinds of change the post-trained planner handled: camera viewpoints, starting object configurations, camera angles, and lighting" %}
{:/nomarkdown}

Does the Jacobian structure still matter once there is a planner? We compared three heads with the same backbone, model size, and data. The Jacobian head stays accurate as we add degrees of freedom, and it needs less data. In closed loop in simulation, it succeeds 70% of the time on the 16-DoF hand and 94% of the time on the 7-DoF arm, where a [UniPi](https://arxiv.org/abs/2302.00111)-style direct inverse dynamics model succeeds 0% of the time on both.

<div class="row l-body ep-hold" style="--ep-hold: 1800 / 839">
  <div class="col-sm">
    {% include figure.liquid path="assets/img/embodied-programming/vera_jacobian_structure.png" class="img-fluid rounded z-depth-1" zoomable=true caption="Action reconstruction error as the degrees of freedom (left) and the number of training samples (right) grow. Lower is better." %}
  </div>
</div>

### On real robots

A few runs from our evaluations. These are examples, not controlled comparisons. First, place the yellow cube on top of the lego block. On the left is the generated plan, on the right what the real robot did.

<div class="row l-body">
  <div class="col-sm">
    <video class="img-fluid rounded z-depth-1" autoplay loop muted playsinline>
      <source src="/assets/video/embodied-programming/vera_yellow_cube_plan_vs_real.mp4" type="video/mp4">
    </video>
    <figcaption class="caption">Generated plan (left) and real execution (right).</figcaption>
  </div>
</div>

The same planner also drives a 16-DoF hand. In simulation, only the prompt changes. Here the body program outputs 16 joint commands.

{::nomarkdown}
{% include posts/embodied-programming/allegro-sim.html %}
{:/nomarkdown}

And on the real hand, with the clockwise prompt. The left two panels are the plan from the video model, and the right two show the real hand executing it.

<div class="row l-body">
  <div class="col-sm">
    <video class="img-fluid rounded z-depth-1" autoplay loop muted playsinline>
      <source src="/assets/video/embodied-programming/vera_allegro_real_plan_vs_real.mp4" type="video/mp4">
    </video>
    <figcaption class="caption">Generated plan (left two) and real execution (right two), from two cameras.</figcaption>
  </div>
</div>

Push the blue button. At the start, only one of the external cameras can see it, and the orange button is a distractor. The wrist camera first looks at the orange button, then finds the blue one and presses it.

<div class="row l-body">
  <div class="col-sm">
    <video class="img-fluid rounded z-depth-1" autoplay loop muted playsinline>
      <source src="/assets/video/embodied-programming/vera_hidden_button.mp4" type="video/mp4">
    </video>
    <figcaption class="caption">Wrist camera, external camera 1, external camera 2.</figcaption>
  </div>
</div>

Finally, we moved the external camera between the two settings below, and asked the robot to place the yellow cube on the white plate. Halfway through, someone moves the plate. In this run, the robot follows the plate and still places the cube on it.

{::nomarkdown}
{% include posts/embodied-programming/gallery.html items="img::camera_setting_1.webp::Setting 1::::t;;img::camera_setting_2.webp::Setting 2::::t" cols=2 aspect="4/3" arrows=true alt="The external camera in its original position, and after we moved it" %}
{:/nomarkdown}

<div class="row l-body">
  <div class="col-sm">
    <video class="img-fluid rounded z-depth-1" autoplay loop muted playsinline>
      <source src="/assets/video/embodied-programming/vera_plate_moved.mp4" type="video/mp4">
    </video>
    <figcaption class="caption">External camera 1, external camera 2, wrist camera.</figcaption>
  </div>
</div>

Act III
{: .ep-act}

# Where should a shared model meet the body?

Video models are becoming robot policies in industry too, for example Rhoda AI's [Direct Video-Action Model](https://www.rhoda.ai/research/direct-video-action) and NVIDIA's [GR00T 2](https://research.nvidia.com/labs/gear/gr00t-2) world action model. So the question is less whether to use a video model, and more where the shared model should meet the body.

The usual way to share one model across robots is a generative action model with one large action placeholder. [RDT-1B](https://arxiv.org/abs/2410.07864) defines a 128-dimensional action vector whose slots have fixed physical meanings: arm joints, grippers, end-effector pose, and the base. Each robot fills in the slots that match its actions, and the rest are padded. Our Allegro hand has 16 finger joints and our pneumatic hand has 15 pressure channels, and neither has a slot. [π0](https://arxiv.org/abs/2410.24164) instead zero-pads every robot's actions to the size of the largest robot, so the same output means different things on different robots. Either way, the shared model has to output each body's own coordinates.

We do the opposite. The shared program never outputs an action. It outputs effects in the world, a video plan, and each body gets its own body program, learned from its own experience. Try each of our four bodies both ways.

{::nomarkdown}
{% include posts/embodied-programming/slots.html %}
{:/nomarkdown}

This is the argument of the talk. Embodiment generalization need not be a distinct learning problem. Much of the problem comes from describing behavior in the coordinates of one particular body. If we describe behavior by its effects in the world, shared programs can act through different bodies, and each body can learn its own mapping from experience.

Epilogue
{: .ep-act}

# Looking forward

Everything above takes an instruction and moves a body. So the whole system can be one tool. A multimodal agent, such as Claude, could call `act("put a plate at each seat")` the way it calls any other tool, and break a long task into such calls. Programs have a recursive structure: a whole system today becomes one call inside a larger program.

{::nomarkdown}
{% include posts/embodied-programming/tool.html %}
{:/nomarkdown}

We have not built this part yet. NVIDIA already describes an agent that controls GR00T 2 as a tool through an API, so I expect this to move quickly. This is where I think embodied programming is going in 2027.

# Acknowledgments

Thank you to the Carney Institute for hosting me, and to everyone who came. Neural Jacobian Fields is joint work with Annan Zhang, Boyuan Chen, Hanna Matusik, Chao Liu, Daniela Rus, and Vincent Sitzmann. VERA is joint work with Evan Kim, Xingjian Bai, Tong Zhao, Tao Pang, Max Simchowitz, and Vincent Sitzmann. I am advised by Vincent Sitzmann and Josh Tenenbaum.

**Neural Jacobian Fields:** [Paper](https://www.nature.com/articles/s41586-025-09170-0) · [Project page](https://sizhe-li.github.io/publication/neural_jacobian_field/) · [Code](https://github.com/sizhe-li/neural-jacobian-field)

**VERA:** [Paper](https://arxiv.org/abs/2605.27817) · [Project page](https://vera.csail.mit.edu/) · [Code](https://github.com/sizhe-li/VERA)

# Citation

{::nomarkdown}
{% include posts/embodied-programming/cite.html %}
{:/nomarkdown}

<script defer src="{{ '/assets/js/posts/embodied-programming.js' | relative_url | bust_file_cache }}"></script>
