'use strict';

const CONFIG = Object.assign({
  eventId: 'big-day-of-play-2026',
  eventName: 'Big Day of Play',
  organizationName: 'Inclusive Health',
  playUrl: location.href.split('?')[0],
  firebaseDatabaseUrl: ''
}, window.DAY_OF_PLAY_CONFIG || {});

const APP = document.getElementById('app');
const TOASTS = document.getElementById('toast-region');
const CONFETTI = document.getElementById('confetti');
const STORAGE_KEY = 'inclusive-health-day-of-play-v1';
const LOCAL_EVENTS_KEY = 'inclusive-health-day-of-play-events-v1';

const ICONS = {
  jumping: '⭐', plank: '🧱', weights: '🏋️', march: '🥁', squats: '⬇️', hops: '🐇',
  toes: '🦶', arms: '⭕', balance: '⚖️', knees: '⬆️', crawl: '🐻', lunges: '🦵',
  wall: '🧱', reaches: '🙌', pushups: '💪', crab: '🦀', taps: '👟', jog: '🏃',
  tree: '🌳', stands: '🪑', heels: '🩰', twists: '🔄', dance: '🎵', breaths: '🌬️'
};

const FAMILY = [
  activity('f-jumping','25 Jumping Jacks','jumping','Do 25 jumping jacks at a comfortable pace.','Try seated jacks, step one foot out at a time, or move only your arms.',null,25),
  activity('f-plank','60-Second Plank','plank','Hold a plank position for up to 60 seconds. Keep your body in a comfortable straight line.','Use your knees, a wall, or a sturdy counter for support.',60),
  activity('f-weights','Hand Weights ×15','weights','Complete 15 controlled curls or presses with light hand weights.','Use water bottles, no weights, or one arm at a time.',null,15),
  activity('f-march','30-Second March','march','March in place for 30 seconds and swing your arms.','March while seated or tap alternating feet.',30),
  activity('f-squats','10 Squats','squats','Complete 10 comfortable squats. Keep your chest lifted.','Hold a chair or do sit-to-stands.',null,10),
  activity('f-hops','10 Hops Each Foot','hops','Hop 10 times on each foot.','Hold a stable surface, do tiny hops, or alternate heel lifts.',null,20),
  activity('f-toes','10 Toe Touches','toes','Reach toward your toes 10 times without bouncing.','Reach toward your knees or shins while seated.',null,10),
  activity('f-arms','15 Arm Circles','arms','Make 15 arm circles, then reverse direction.','Make smaller circles or move one arm at a time.',null,30),
  activity('f-balance','20-Second Balance','balance','Balance on one foot for 20 seconds. Switch feet if you like.','Keep one hand on a chair or keep your toes touching the floor.',20),
  activity('f-knees','20 High Knees','knees','Lift alternating knees 20 times.','Do seated knee lifts or march gently.',null,20),
  activity('f-crawl','10 Bear Crawl Steps','crawl','Take 10 slow bear-crawl steps.','Do standing cross-body reaches instead.',null,10),
  activity('f-lunges','15 Lunges','lunges','Complete 15 alternating lunges or step-backs.','Hold a chair, shorten the movement, or do seated leg extensions.',null,15),
  activity('f-wall','30-Second Wall Sit','wall','Hold a wall sit for up to 30 seconds.','Stay higher on the wall or hold a supported mini-squat.',30),
  activity('f-reaches','10 Sky Reaches','reaches','Reach both hands toward the sky 10 times.','Reach one arm at a time or do the movement seated.',null,10),
  activity('f-pushups','10 Push-Ups','pushups','Complete 10 push-ups at your chosen level.','Use a wall, counter, or your knees.',null,10),
  activity('f-crab','10 Crab Walk Steps','crab','Take 10 crab-walk steps.','Do seated triceps presses or alternating heel taps.',null,10),
  activity('f-taps','20 Toe Taps','taps','Tap alternating toes 20 times.','Tap while seated or hold a stable surface.',null,20),
  activity('f-jog','45-Second Jog','jog','Jog in place for 45 seconds.','March, step side to side, or do a seated march.',45),
  activity('f-tree','30-Second Tree Pose','tree','Hold tree pose for up to 30 seconds.','Keep one foot low and use a chair or wall.',30),
  activity('f-stands','12 Sit-to-Stands','stands','Stand up and sit down 12 times with control.','Use your hands or complete fewer repetitions.',null,12),
  activity('f-heels','20 Heel Raises','heels','Lift and lower your heels 20 times.','Hold a stable surface or do the movement seated.',null,20),
  activity('f-twists','20 Twists','twists','Complete 20 gentle torso twists.','Keep the movement small or twist while seated upright.',null,20),
  activity('f-dance','30-Second Dance Party','dance','Dance any way you like for 30 seconds.','Dance seated, move your arms, or tap to the beat.',30),
  activity('f-breaths','5 Deep Breaths','breaths','Take 5 slow, comfortable breaths.','Breathe naturally and focus on relaxing your shoulders.',null,5)
];

const CHALLENGE = [
  activity('c-jumping','40 Jumping Jacks','jumping','Complete 40 jumping jacks at a steady pace.','Use step jacks or seated jacks.',null,40),
  activity('c-plank','90-Second Plank','plank','Hold your chosen plank for up to 90 seconds.','Use your knees, a wall, or a sturdy counter.',90),
  activity('c-weights','Hand Weights ×20','weights','Complete 20 controlled curls or presses with light weights.','Use water bottles, no weights, or alternate arms.',null,20),
  activity('c-march','60-Second Power March','march','March briskly in place for 60 seconds.','March seated or slow the pace.',60),
  activity('c-squats','20 Squats','squats','Complete 20 controlled squats.','Hold a chair or do sit-to-stands.',null,20),
  activity('c-hops','20 Hops Each Foot','hops','Complete 20 hops on each foot.','Hold a stable surface or alternate heel lifts.',null,40),
  activity('c-toes','15 Toe Touches','toes','Complete 15 controlled toe reaches.','Reach toward your knees or shins.',null,15),
  activity('c-arms','20 Arm Circles Each Way','arms','Make 20 arm circles forward and 20 backward.','Use smaller circles or one arm at a time.',null,40),
  activity('c-balance','30-Second Balance','balance','Balance on one foot for 30 seconds, then switch if desired.','Use a wall or chair and keep one toe down.',30),
  activity('c-knees','30 High Knees','knees','Complete 30 alternating high knees.','March or do seated knee lifts.',null,30),
  activity('c-crawl','12 Bear Crawl Steps','crawl','Take 12 controlled bear-crawl steps.','Do standing cross-body reaches.',null,12),
  activity('c-lunges','20 Lunges','lunges','Complete 20 alternating lunges or step-backs.','Hold a chair or do supported mini-lunges.',null,20),
  activity('c-wall','45-Second Wall Sit','wall','Hold a wall sit for up to 45 seconds.','Stay higher or hold a supported mini-squat.',45),
  activity('c-reaches','15 Sky Reaches','reaches','Reach tall 15 times, rising onto your toes if comfortable.','Remain flat-footed or reach while seated.',null,15),
  activity('c-pushups','15 Push-Ups','pushups','Complete 15 push-ups at your chosen level.','Use a wall, counter, or your knees.',null,15),
  activity('c-crab','15 Crab Walk Steps','crab','Take 15 crab-walk steps.','Do seated triceps presses or heel taps.',null,15),
  activity('c-taps','30 Toe Taps','taps','Complete 30 alternating toe taps.','Tap while seated or hold support.',null,30),
  activity('c-jog','60-Second Jog','jog','Jog in place for 60 seconds.','March, step side to side, or move seated.',60),
  activity('c-tree','45-Second Tree Pose','tree','Hold tree pose for up to 45 seconds.','Keep one foot low and use support.',45),
  activity('c-stands','15 Sit-to-Stands','stands','Complete 15 sit-to-stands with control.','Use your hands or reduce the repetitions.',null,15),
  activity('c-heels','25 Heel Raises','heels','Complete 25 controlled heel raises.','Hold support or do them seated.',null,25),
  activity('c-twists','30 Twists','twists','Complete 30 controlled torso twists.','Keep the movement small or remain seated upright.',null,30),
  activity('c-dance','45-Second Dance Party','dance','Dance continuously for 45 seconds.','Dance seated or move only the parts that feel good.',45),
  activity('c-breaths','8 Deep Breaths','breaths','Take 8 slow, comfortable breaths and relax your shoulders.','Breathe naturally without forcing a deep breath.',null,8)
];

const FREE_SPACE = {
  id: 'free', name: 'FREE SPACE', icon: '🎉', instruction: 'This square is already yours!',
  modification: 'Celebrate exactly as you are.', seconds: null, reps: null, free: true
};

const LINES = [
  [0,1,2,3,4],[5,6,7,8,9],[10,11,12,13,14],[15,16,17,18,19],[20,21,22,23,24],
  [0,5,10,15,20],[1,6,11,16,21],[2,7,12,17,22],[3,8,13,18,23],[4,9,14,19,24],
  [0,6,12,18,24],[4,8,12,16,20]
];
