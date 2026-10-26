# ۱۶ — قالب‌ها

## ۰. قاعده

قالب‌ها جای تحلیل را نمی‌گیرند. هر فیلد را با شاهد/تصمیم پر کن؛ فیلد خالی را با «نامشخص» رها نکن.

## ۱. پذیرش پروژه

```yaml
project_id:
source_title:
source_author:
source_year:
source_language:
translator:
edition:
rights_status:
output_level: A|B|C|D
platform:
audience:
duration:
team:
budget:
deadline:
constraints:
sensitive_topics:
```

## ۲. شناسنامهٔ منبع

```yaml
source_id:
title:
author:
year:
language:
translator:
publisher:
edition:
isbn:
pages:
words:
chapters:
genres:
period:
setting:
narration:
rights:
```

## ۳. نقل‌قول

```csv
id,quote,location,context,function,verified
Q001,"...","ص ۱۲",صحنه,رابطه,yes
```

## ۴. اطلس روایی

```csv
id,act,chapter,scene,title,summary,fabula_time,sjuzhet_order,characters,setting,conflict,turn,info_revealed,function,protocol,dominant,motifs,quotes,coverage,reason,priority
```

## ۵. پوشش

```csv
unit_id,story_function,kept_function,how,risk,owner
```

## ۶. کارت واحد تراگشت

```yaml
id:
title:
source_units:
source_quotes:
subject_expectation:
protocol:
intervention:
de_dominance_function:
suspension:
technique:
equivalence:
  print:
  computer:
  function:
computational_materials:
game_design:
narrative_design:
art:
audio:
ai:
ui:
technical:
feedback:
free_space:
untranslatability:
acceptance:
```

## ۷. قصه

```yaml
premise:
dramatic_question:
protagonist:
want:
need:
fear:
antagonist:
conflict:
stakes:
inciting_incident:
midpoint:
crisis:
climax:
aftermath:
endings:
```

## ۸. شخصیت

```yaml
id:
name:
role:
age:
appearance:
body:
voice:
want:
need:
fear:
contradiction:
relationships:
arc:
secrets:
objects:
places:
game_role:
ai_behavior:
dialogue_rules:
```

## ۹. جهان/مکان

```yaml
id:
name:
type:
owner:
function:
mood:
light:
sound:
smell:
materials:
access:
exits:
secrets:
interactables:
narrative_role:
```

## ۱۰. کانسپت

```yaml
concept_id:
title:
one_line:
player_role:
core_verb:
world:
camera:
core_loop:
goals:
obstacles:
failure:
progression:
economy:
narrative_structure:
dominance:
de_dominance:
signature_scene:
art:
audio:
ai:
ui:
engine:
scope:
risks:
```

## ۱۱. GDD

```yaml
core_verb:
secondary_verbs:
core_loop:
session_loop:
long_loop:
choice_consequence:
progression:
economy:
levels:
difficulty:
accessibility:
endings:
replay:
```

## ۱۲. ماتریس هویت

```csv
id,domain,unit_or_system,source_evidence,source_function,domain_thesis,player_experience,artifact,coupling,removal_test,acceptance_evidence,status,notes
```

## ۱۳. برش عمودی

```yaml
slice_id:
unit:
duration:
location:
verb:
npc:
choice:
consequence:
challenge:
art:
audio:
ui:
technical:
success_criteria:
out_of_scope:
```

## ۱۴. پلی‌تست

```yaml
date:
build:
facilitator:
participants:
tasks:
observations:
quotes:
story_retell:
game_understanding:
dominance:
multimedia:
identity:
accessibility:
bugs:
decisions:
```

## ۱۵. پذیرش

```yaml
build:
date:
participants:
pass:
fail:
conditions:
critical_bugs:
unverified:
next:
```

## ۱۶. فضای آزاد

```yaml
free_space_id:
what:
why:
player_interpretation:
constraints:
risk:
```

## ۱۷. انتقال‌ناپذیری

```yaml
item:
source_function:
why_untranslatable:
replacement:
what_is_lost:
what_must_not_be_lost:
mitigation:
```

## ۱۸. تصمیم

```yaml
decision_id:
question:
options:
evidence:
chosen:
reason:
owner:
date:
review:
```

## ۱۹. ریسک

```yaml
risk_id:
description:
probability:
impact:
mitigation:
owner:
trigger:
response:
```

## ۲۰. اعتبارسنجی پیش از تحویل

- [ ] همهٔ فایل‌های ارجاع‌شده وجود دارند.
- [ ] هیچ لینک شکسته‌ای نیست.
- [ ] هیچ ادعای بی‌شاهد نیست.
- [ ] برچسب‌ها (`[رساله]`/`[توسعه]`/`[پروژه]`) درست‌اند.
- [ ] سطح خروجی صادقانه است.
- [ ] پلی‌تست/اعتبارنیافته مشخص است.
- [ ] حقوق/مجوزها ثبت شده‌اند.
- [ ] برش عمودی همهٔ هفت حوزه را نشان می‌دهد.
- [ ] قصه قابل بازگویی است.
- [ ] بازی، بازی است.
