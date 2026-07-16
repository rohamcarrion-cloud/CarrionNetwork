## 2026-07-16 18:49:32.514Z load
- url: http://localhost:3000/

## 2026-07-16 18:49:32.563Z navigate
- url: http://localhost:3000/
- via: replaceState

## 2026-07-16 19:49:32.988Z click
- element: {"tag":"button","role":null,"ariaLabel":null,"name":null,"type":null,"id":null,"placeholder":null,"label":null,"value":null,"valueLength":0,"text":"Create account"}

## 2026-07-16 19:49:32.995Z navigate
- url: http://localhost:3000/signup
- via: pushState

## 2026-07-16 19:49:34.129Z focus
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":"email","id":"email","placeholder":null,"label":"Email","value":"","valueLength":0,"text":""}

## 2026-07-16 19:49:34.227Z click
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":"email","id":"email","placeholder":null,"label":"Email","value":"","valueLength":0,"text":""}

## 2026-07-16 19:49:45.601Z change
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":"email","id":"email","placeholder":null,"label":"Email","value":"test@example.com","valueLength":16,"text":""}

## 2026-07-16 19:49:45.602Z blur
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":"email","id":"email","placeholder":null,"label":"Email","value":"test@example.com","valueLength":16,"text":""}

## 2026-07-16 19:49:45.610Z focus
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":null,"id":"username","placeholder":null,"label":"Username","value":"","valueLength":0,"text":""}

## 2026-07-16 19:49:45.733Z click
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":null,"id":"username","placeholder":null,"label":"Username","value":"","valueLength":0,"text":""}

## 2026-07-16 19:50:00.383Z change
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":null,"id":"username","placeholder":null,"label":"Username","value":"TestUsername","valueLength":12,"text":""}

## 2026-07-16 19:50:00.384Z blur
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":null,"id":"username","placeholder":null,"label":"Username","value":"TestUsername","valueLength":12,"text":""}

## 2026-07-16 19:50:00.390Z focus
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":"password","id":"password","placeholder":null,"label":"Password","value":"[redacted:length=0]","valueLength":0,"text":""}

## 2026-07-16 19:50:00.464Z click
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":"password","id":"password","placeholder":null,"label":"Password","value":"[redacted:length=0]","valueLength":0,"text":""}

## 2026-07-16 19:50:12.668Z change
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":"password","id":"password","placeholder":null,"label":"Password","value":"[redacted:length=11]","valueLength":11,"text":""}

## 2026-07-16 19:50:12.668Z blur
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":"password","id":"password","placeholder":null,"label":"Password","value":"[redacted:length=11]","valueLength":11,"text":""}

## 2026-07-16 19:50:12.674Z focus
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":"password","id":"confirm","placeholder":null,"label":"Confirm password","value":"[redacted:length=0]","valueLength":0,"text":""}

## 2026-07-16 19:50:12.765Z click
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":"password","id":"confirm","placeholder":null,"label":"Confirm password","value":"[redacted:length=0]","valueLength":0,"text":""}

## 2026-07-16 19:50:18.382Z change
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":"password","id":"confirm","placeholder":null,"label":"Confirm password","value":"[redacted:length=11]","valueLength":11,"text":""}

## 2026-07-16 19:50:18.382Z blur
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":"password","id":"confirm","placeholder":null,"label":"Confirm password","value":"[redacted:length=11]","valueLength":11,"text":""}

## 2026-07-16 19:50:18.482Z click
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":"checkbox","id":null,"placeholder":null,"label":"I agree to the Terms of Service and Privacy Policy.","value":"on","valueLength":2,"text":""}

## 2026-07-16 19:50:18.484Z change
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":"checkbox","id":null,"placeholder":null,"label":"I agree to the Terms of Service and Privacy Policy.","value":"on","valueLength":2,"text":""}

## 2026-07-16 19:50:20.018Z click
- element: {"tag":"button","role":null,"ariaLabel":null,"name":null,"type":"submit","id":null,"placeholder":null,"label":null,"value":null,"valueLength":0,"text":"Create account"}

## 2026-07-16 19:50:20.023Z submit
- action: http://localhost:3000/signup
- fields: [{"label":"Email","type":"email","value":"test@example.com","length":16,"redacted":false},{"label":"Username","type":"text","value":"TestUsername","length":12,"redacted":false},{"label":"Password","type":"password","value":"[redacted:length=11]","length":11,"redacted":true},{"label":"Confirm password","type":"password","value":"[redacted:length=11]","length":11,"redacted":true},{"label":"I agree to the Terms of Service and Privacy Policy.","type":"checkbox","value":"on","length":2,"redacted":false},{"label":"[submit]","type":"submit","value":"","length":0,"redacted":false}]

## 2026-07-16 19:50:20.103Z network.error
- method: POST
- url: http://localhost:3000/hcgi/platform/api/collections/users/records
- status: 404
- statusText: Not Found
- requestBody: {"email":"test@example.com","password":"[redacted:length=11]","passwordConfirm":"[redacted:length=11]","username":"TestUsername"}
- durationMs: 72

## 2026-07-16 19:50:20.104Z console.error
- text: Fetch error from http://localhost:3000/hcgi/platform/api/collections/users/records: 

## 2026-07-16 19:51:04.364Z click
- element: {"tag":"p","role":null,"ariaLabel":null,"name":null,"type":null,"id":null,"placeholder":null,"label":null,"value":null,"valueLength":0,"text":"Registration failed. Please try again."}

## 2026-07-16 19:51:04.566Z click
- element: {"tag":"p","role":null,"ariaLabel":null,"name":null,"type":null,"id":null,"placeholder":null,"label":null,"value":null,"valueLength":0,"text":"Registration failed. Please try again."}

## 2026-07-16 19:51:04.749Z click
- element: {"tag":"p","role":null,"ariaLabel":null,"name":null,"type":null,"id":null,"placeholder":null,"label":null,"value":null,"valueLength":0,"text":"Registration failed. Please try again."}

## 2026-07-16 19:57:49.396Z load
- url: http://localhost:3000/signup

## 2026-07-16 19:57:52.296Z load
- url: http://localhost:3000/signup

## 2026-07-16 19:57:53.328Z load
- url: http://localhost:3000/signup

## 2026-07-16 19:57:54.425Z click
- element: {"tag":"a","role":null,"ariaLabel":null,"name":null,"type":null,"id":null,"placeholder":null,"label":null,"value":null,"valueLength":0,"text":"Carrion Networks"}

## 2026-07-16 19:57:54.427Z navigate
- url: http://localhost:3000/
- via: pushState

## 2026-07-16 19:57:55.644Z click
- element: {"tag":"a","role":null,"ariaLabel":null,"name":null,"type":null,"id":null,"placeholder":null,"label":null,"value":null,"valueLength":0,"text":"Sign in"}

## 2026-07-16 19:57:55.646Z navigate
- url: http://localhost:3000/signin
- via: pushState

## 2026-07-16 19:57:55.692Z focus
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":"email","id":"email","placeholder":null,"label":"Email","value":"","valueLength":0,"text":""}

## 2026-07-16 19:57:58.491Z click
- element: {"tag":"a","role":null,"ariaLabel":null,"name":null,"type":null,"id":null,"placeholder":null,"label":null,"value":null,"valueLength":0,"text":"Carrion Networks"}

## 2026-07-16 19:57:58.492Z navigate
- url: http://localhost:3000/
- via: pushState

## 2026-07-16 19:57:59.447Z click
- element: {"tag":"button","role":null,"ariaLabel":null,"name":null,"type":null,"id":null,"placeholder":null,"label":null,"value":null,"valueLength":0,"text":"Create account"}

## 2026-07-16 19:57:59.448Z navigate
- url: http://localhost:3000/signup
- via: pushState

## 2026-07-16 19:58:40.631Z focus
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":"email","id":"email","placeholder":null,"label":"Email","value":"","valueLength":0,"text":""}

## 2026-07-16 19:58:40.693Z click
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":"email","id":"email","placeholder":null,"label":"Email","value":"","valueLength":0,"text":""}

## 2026-07-16 19:58:47.311Z change
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":"email","id":"email","placeholder":null,"label":"Email","value":"test@example.com","valueLength":16,"text":""}

## 2026-07-16 19:58:47.312Z blur
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":"email","id":"email","placeholder":null,"label":"Email","value":"test@example.com","valueLength":16,"text":""}

## 2026-07-16 19:58:47.318Z focus
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":null,"id":"username","placeholder":null,"label":"Username","value":"","valueLength":0,"text":""}

## 2026-07-16 19:58:47.427Z click
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":null,"id":"username","placeholder":null,"label":"Username","value":"","valueLength":0,"text":""}

## 2026-07-16 19:58:56.365Z change
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":null,"id":"username","placeholder":null,"label":"Username","value":"testusername","valueLength":12,"text":""}

## 2026-07-16 19:58:56.365Z blur
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":null,"id":"username","placeholder":null,"label":"Username","value":"testusername","valueLength":12,"text":""}

## 2026-07-16 19:58:56.369Z focus
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":"password","id":"password","placeholder":null,"label":"Password","value":"[redacted:length=0]","valueLength":0,"text":""}

## 2026-07-16 19:58:56.477Z click
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":"password","id":"password","placeholder":null,"label":"Password","value":"[redacted:length=0]","valueLength":0,"text":""}

## 2026-07-16 19:59:08.394Z change
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":"password","id":"password","placeholder":null,"label":"Password","value":"[redacted:length=12]","valueLength":12,"text":""}

## 2026-07-16 19:59:08.394Z blur
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":"password","id":"password","placeholder":null,"label":"Password","value":"[redacted:length=12]","valueLength":12,"text":""}

## 2026-07-16 19:59:08.400Z focus
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":"password","id":"confirm","placeholder":null,"label":"Confirm password","value":"[redacted:length=0]","valueLength":0,"text":""}

## 2026-07-16 19:59:08.512Z click
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":"password","id":"confirm","placeholder":null,"label":"Confirm password","value":"[redacted:length=0]","valueLength":0,"text":""}

## 2026-07-16 19:59:14.432Z change
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":"password","id":"confirm","placeholder":null,"label":"Confirm password","value":"[redacted:length=11]","valueLength":11,"text":""}

## 2026-07-16 19:59:14.432Z blur
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":"password","id":"confirm","placeholder":null,"label":"Confirm password","value":"[redacted:length=11]","valueLength":11,"text":""}

## 2026-07-16 19:59:14.529Z click
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":"checkbox","id":null,"placeholder":null,"label":"I agree to the Terms of Service and Privacy Policy.","value":"on","valueLength":2,"text":""}

## 2026-07-16 19:59:14.531Z change
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":"checkbox","id":null,"placeholder":null,"label":"I agree to the Terms of Service and Privacy Policy.","value":"on","valueLength":2,"text":""}

## 2026-07-16 19:59:16.077Z click
- element: {"tag":"button","role":null,"ariaLabel":null,"name":null,"type":"submit","id":null,"placeholder":null,"label":null,"value":null,"valueLength":0,"text":"Create account"}

## 2026-07-16 19:59:16.083Z submit
- action: http://localhost:3000/signup
- fields: [{"label":"Email","type":"email","value":"test@example.com","length":16,"redacted":false},{"label":"Username","type":"text","value":"testusername","length":12,"redacted":false},{"label":"Password","type":"password","value":"[redacted:length=12]","length":12,"redacted":true},{"label":"Confirm password","type":"password","value":"[redacted:length=11]","length":11,"redacted":true},{"label":"I agree to the Terms of Service and Privacy Policy.","type":"checkbox","value":"on","length":2,"redacted":false},{"label":"[submit]","type":"submit","value":"","length":0,"redacted":false}]

## 2026-07-16 19:59:17.749Z focus
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":"password","id":"confirm","placeholder":null,"label":"Confirm password","value":"[redacted:length=11]","valueLength":11,"text":""}

## 2026-07-16 19:59:17.814Z click
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":"password","id":"confirm","placeholder":null,"label":"Confirm password","value":"[redacted:length=11]","valueLength":11,"text":""}

## 2026-07-16 19:59:17.993Z click
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":"password","id":"confirm","placeholder":null,"label":"Confirm password","value":"[redacted:length=11]","valueLength":11,"text":""}

## 2026-07-16 19:59:19.493Z change
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":"password","id":"confirm","placeholder":null,"label":"Confirm password","value":"[redacted:length=0]","valueLength":0,"text":""}

## 2026-07-16 19:59:19.499Z focus
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":"password","id":"password","placeholder":null,"label":"Password","value":"[redacted:length=12]","valueLength":12,"text":""}

## 2026-07-16 19:59:19.575Z click
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":"password","id":"password","placeholder":null,"label":"Password","value":"[redacted:length=12]","valueLength":12,"text":""}

## 2026-07-16 19:59:20.243Z click
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":"password","id":"password","placeholder":null,"label":"Password","value":"[redacted:length=12]","valueLength":12,"text":""}

## 2026-07-16 19:59:20.410Z click
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":"password","id":"password","placeholder":null,"label":"Password","value":"[redacted:length=12]","valueLength":12,"text":""}

## 2026-07-16 19:59:20.577Z click
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":"password","id":"password","placeholder":null,"label":"Password","value":"[redacted:length=12]","valueLength":12,"text":""}

## 2026-07-16 19:59:24.798Z change
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":"password","id":"password","placeholder":null,"label":"Password","value":"[redacted:length=7]","valueLength":7,"text":""}

## 2026-07-16 19:59:24.798Z blur
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":"password","id":"password","placeholder":null,"label":"Password","value":"[redacted:length=7]","valueLength":7,"text":""}

## 2026-07-16 19:59:24.804Z focus
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":"password","id":"confirm","placeholder":null,"label":"Confirm password","value":"[redacted:length=0]","valueLength":0,"text":""}

## 2026-07-16 19:59:24.860Z click
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":"password","id":"confirm","placeholder":null,"label":"Confirm password","value":"[redacted:length=0]","valueLength":0,"text":""}

## 2026-07-16 19:59:28.214Z change
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":"password","id":"confirm","placeholder":null,"label":"Confirm password","value":"[redacted:length=7]","valueLength":7,"text":""}

## 2026-07-16 19:59:28.214Z blur
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":"password","id":"confirm","placeholder":null,"label":"Confirm password","value":"[redacted:length=7]","valueLength":7,"text":""}

## 2026-07-16 19:59:28.327Z click
- element: {"tag":"button","role":null,"ariaLabel":null,"name":null,"type":"submit","id":null,"placeholder":null,"label":null,"value":null,"valueLength":0,"text":"Create account"}

## 2026-07-16 19:59:28.329Z submit
- action: http://localhost:3000/signup
- fields: [{"label":"Email","type":"email","value":"test@example.com","length":16,"redacted":false},{"label":"Username","type":"text","value":"testusername","length":12,"redacted":false},{"label":"Password","type":"password","value":"[redacted:length=7]","length":7,"redacted":true},{"label":"Confirm password","type":"password","value":"[redacted:length=7]","length":7,"redacted":true},{"label":"I agree to the Terms of Service and Privacy Policy.","type":"checkbox","value":"on","length":2,"redacted":false},{"label":"[submit]","type":"submit","value":"","length":0,"redacted":false}]

## 2026-07-16 19:59:30.017Z focus
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":"password","id":"password","placeholder":null,"label":"Password","value":"[redacted:length=7]","valueLength":7,"text":""}

## 2026-07-16 19:59:30.108Z click
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":"password","id":"password","placeholder":null,"label":"Password","value":"[redacted:length=7]","valueLength":7,"text":""}

## 2026-07-16 19:59:30.409Z click
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":"password","id":"password","placeholder":null,"label":"Password","value":"[redacted:length=7]","valueLength":7,"text":""}

## 2026-07-16 19:59:36.944Z change
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":"password","id":"password","placeholder":null,"label":"Password","value":"[redacted:length=11]","valueLength":11,"text":""}

## 2026-07-16 19:59:36.944Z blur
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":"password","id":"password","placeholder":null,"label":"Password","value":"[redacted:length=11]","valueLength":11,"text":""}

## 2026-07-16 19:59:36.947Z focus
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":"password","id":"confirm","placeholder":null,"label":"Confirm password","value":"[redacted:length=7]","valueLength":7,"text":""}

## 2026-07-16 19:59:37.027Z click
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":"password","id":"confirm","placeholder":null,"label":"Confirm password","value":"[redacted:length=7]","valueLength":7,"text":""}

## 2026-07-16 19:59:37.193Z click
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":"password","id":"confirm","placeholder":null,"label":"Confirm password","value":"[redacted:length=7]","valueLength":7,"text":""}

## 2026-07-16 19:59:37.393Z click
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":"password","id":"confirm","placeholder":null,"label":"Confirm password","value":"[redacted:length=7]","valueLength":7,"text":""}

## 2026-07-16 19:59:42.984Z change
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":"password","id":"confirm","placeholder":null,"label":"Confirm password","value":"[redacted:length=11]","valueLength":11,"text":""}

## 2026-07-16 19:59:42.984Z blur
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":"password","id":"confirm","placeholder":null,"label":"Confirm password","value":"[redacted:length=11]","valueLength":11,"text":""}

## 2026-07-16 19:59:43.058Z click
- element: {"tag":"button","role":null,"ariaLabel":null,"name":null,"type":"submit","id":null,"placeholder":null,"label":null,"value":null,"valueLength":0,"text":"Create account"}

## 2026-07-16 19:59:43.060Z submit
- action: http://localhost:3000/signup
- fields: [{"label":"Email","type":"email","value":"test@example.com","length":16,"redacted":false},{"label":"Username","type":"text","value":"testusername","length":12,"redacted":false},{"label":"Password","type":"password","value":"[redacted:length=11]","length":11,"redacted":true},{"label":"Confirm password","type":"password","value":"[redacted:length=11]","length":11,"redacted":true},{"label":"I agree to the Terms of Service and Privacy Policy.","type":"checkbox","value":"on","length":2,"redacted":false},{"label":"[submit]","type":"submit","value":"","length":0,"redacted":false}]

## 2026-07-16 19:59:43.072Z network.error
- method: POST
- url: http://localhost:3000/hcgi/platform/api/collections/users/records
- status: 404
- statusText: Not Found
- requestBody: {"email":"test@example.com","password":"[redacted:length=11]","passwordConfirm":"[redacted:length=11]","username":"testusername"}
- durationMs: 10

## 2026-07-16 19:59:43.072Z console.error
- text: Fetch error from http://localhost:3000/hcgi/platform/api/collections/users/records: 

## 2026-07-16 19:59:45.524Z click
- element: {"tag":"p","role":null,"ariaLabel":null,"name":null,"type":null,"id":null,"placeholder":null,"label":null,"value":null,"valueLength":0,"text":"Registration failed. Please try again."}

## 2026-07-16 19:59:45.842Z click
- element: {"tag":"p","role":null,"ariaLabel":null,"name":null,"type":null,"id":null,"placeholder":null,"label":null,"value":null,"valueLength":0,"text":"Registration failed. Please try again."}

## 2026-07-16 19:59:46.042Z click
- element: {"tag":"p","role":null,"ariaLabel":null,"name":null,"type":null,"id":null,"placeholder":null,"label":null,"value":null,"valueLength":0,"text":"Registration failed. Please try again."}

## 2026-07-16 20:14:32.824Z click
- element: {"tag":"button","role":null,"ariaLabel":null,"name":null,"type":"submit","id":null,"placeholder":null,"label":null,"value":null,"valueLength":0,"text":"Create account"}

## 2026-07-16 20:14:32.848Z submit
- action: http://localhost:3000/signup
- fields: [{"label":"Email","type":"email","value":"test@example.com","length":16,"redacted":false},{"label":"Username","type":"text","value":"testusername","length":12,"redacted":false},{"label":"Password","type":"password","value":"[redacted:length=11]","length":11,"redacted":true},{"label":"Confirm password","type":"password","value":"[redacted:length=11]","length":11,"redacted":true},{"label":"I agree to the Terms of Service and Privacy Policy.","type":"checkbox","value":"on","length":2,"redacted":false},{"label":"[submit]","type":"submit","value":"","length":0,"redacted":false}]

## 2026-07-16 20:14:32.884Z network.error
- method: POST
- url: http://localhost:3000/hcgi/platform/api/collections/users/records
- status: 404
- statusText: Not Found
- requestBody: {"email":"test@example.com","password":"[redacted:length=11]","passwordConfirm":"[redacted:length=11]","username":"testusername"}
- durationMs: 30

## 2026-07-16 20:14:32.884Z console.error
- text: Fetch error from http://localhost:3000/hcgi/platform/api/collections/users/records: 

## 2026-07-16 20:14:34.356Z click
- element: {"tag":"button","role":null,"ariaLabel":null,"name":null,"type":"submit","id":null,"placeholder":null,"label":null,"value":null,"valueLength":0,"text":"Create account"}

## 2026-07-16 20:14:34.358Z submit
- action: http://localhost:3000/signup
- fields: [{"label":"Email","type":"email","value":"test@example.com","length":16,"redacted":false},{"label":"Username","type":"text","value":"testusername","length":12,"redacted":false},{"label":"Password","type":"password","value":"[redacted:length=11]","length":11,"redacted":true},{"label":"Confirm password","type":"password","value":"[redacted:length=11]","length":11,"redacted":true},{"label":"I agree to the Terms of Service and Privacy Policy.","type":"checkbox","value":"on","length":2,"redacted":false},{"label":"[submit]","type":"submit","value":"","length":0,"redacted":false}]

## 2026-07-16 20:14:34.366Z network.error
- method: POST
- url: http://localhost:3000/hcgi/platform/api/collections/users/records
- status: 404
- statusText: Not Found
- requestBody: {"email":"test@example.com","password":"[redacted:length=11]","passwordConfirm":"[redacted:length=11]","username":"testusername"}
- durationMs: 7

## 2026-07-16 20:14:34.366Z console.error
- text: Fetch error from http://localhost:3000/hcgi/platform/api/collections/users/records: 

## 2026-07-16 20:17:01.883Z load
- url: http://localhost:3000/signup

## 2026-07-16 20:17:05.024Z click
- element: {"tag":"div","role":null,"ariaLabel":null,"name":null,"type":null,"id":null,"placeholder":null,"label":null,"value":null,"valueLength":0,"text":"Carrion NetworksCreate your accountJoin as a listener — upgrade to creator anytime.EmailUsernamePasswordAt least 8 characters.Confirm passwordI agree to the Terms of Service and Privacy Policy.Create accountAlready have an account? Sign in"}

## 2026-07-16 20:17:08.005Z click
- element: {"tag":"div","role":null,"ariaLabel":null,"name":null,"type":null,"id":null,"placeholder":null,"label":null,"value":null,"valueLength":0,"text":"Carrion NetworksCreate your accountJoin as a listener — upgrade to creator anytime.EmailUsernamePasswordAt least 8 characters.Confirm passwordI agree to the Terms of Service and Privacy Policy.Create accountAlready have an account? Sign in"}

## 2026-07-16 20:17:08.871Z click
- element: {"tag":"a","role":null,"ariaLabel":null,"name":null,"type":null,"id":null,"placeholder":null,"label":null,"value":null,"valueLength":0,"text":"Carrion Networks"}

## 2026-07-16 20:17:08.876Z navigate
- url: http://localhost:3000/
- via: pushState

## 2026-07-16 20:17:19.242Z load
- url: http://localhost:3000/

## 2026-07-16 20:17:41.459Z load
- url: http://localhost:3000/

## 2026-07-16 20:17:41.539Z navigate
- url: http://localhost:3000/
- via: replaceState

## 2026-07-16 20:18:30.348Z click
- element: {"tag":"button","role":null,"ariaLabel":null,"name":null,"type":null,"id":null,"placeholder":null,"label":null,"value":null,"valueLength":0,"text":"Create account"}

## 2026-07-16 20:18:30.349Z navigate
- url: http://localhost:3000/signup
- via: pushState

## 2026-07-16 20:19:22.553Z load
- url: http://localhost:3000/

## 2026-07-16 20:19:22.615Z navigate
- url: http://localhost:3000/
- via: replaceState

## 2026-07-16 20:19:23.192Z load
- url: http://localhost:3000/

## 2026-07-16 20:19:23.223Z navigate
- url: http://localhost:3000/
- via: replaceState

## 2026-07-16 20:19:30.021Z click
- element: {"tag":"button","role":null,"ariaLabel":null,"name":null,"type":null,"id":null,"placeholder":null,"label":null,"value":null,"valueLength":0,"text":"Create account"}

## 2026-07-16 20:19:30.023Z navigate
- url: http://localhost:3000/signup
- via: pushState

## 2026-07-16 20:19:31.288Z click
- element: {"tag":"div","role":null,"ariaLabel":null,"name":null,"type":null,"id":null,"placeholder":null,"label":null,"value":null,"valueLength":0,"text":"Email"}

## 2026-07-16 20:19:31.724Z focus
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":"email","id":"email","placeholder":null,"label":"Email","value":"","valueLength":0,"text":""}

## 2026-07-16 20:19:31.821Z click
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":"email","id":"email","placeholder":null,"label":"Email","value":"","valueLength":0,"text":""}

## 2026-07-16 20:19:36.809Z change
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":"email","id":"email","placeholder":null,"label":"Email","value":"test@test.com","valueLength":13,"text":""}

## 2026-07-16 20:19:36.810Z blur
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":"email","id":"email","placeholder":null,"label":"Email","value":"test@test.com","valueLength":13,"text":""}

## 2026-07-16 20:19:36.812Z focus
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":null,"id":"username","placeholder":null,"label":"Username","value":"","valueLength":0,"text":""}

## 2026-07-16 20:19:42.724Z change
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":null,"id":"username","placeholder":null,"label":"Username","value":"testusername","valueLength":12,"text":""}

## 2026-07-16 20:19:42.724Z blur
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":null,"id":"username","placeholder":null,"label":"Username","value":"testusername","valueLength":12,"text":""}

## 2026-07-16 20:19:42.731Z focus
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":"password","id":"password","placeholder":null,"label":"Password","value":"[redacted:length=0]","valueLength":0,"text":""}

## 2026-07-16 20:19:42.802Z click
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":"password","id":"password","placeholder":null,"label":"Password","value":"[redacted:length=0]","valueLength":0,"text":""}

## 2026-07-16 20:19:56.970Z change
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":"password","id":"password","placeholder":null,"label":"Password","value":"[redacted:length=11]","valueLength":11,"text":""}

## 2026-07-16 20:19:56.971Z blur
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":"password","id":"password","placeholder":null,"label":"Password","value":"[redacted:length=11]","valueLength":11,"text":""}

## 2026-07-16 20:19:56.976Z focus
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":"password","id":"confirm","placeholder":null,"label":"Confirm password","value":"[redacted:length=0]","valueLength":0,"text":""}

## 2026-07-16 20:19:57.086Z click
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":"password","id":"confirm","placeholder":null,"label":"Confirm password","value":"[redacted:length=0]","valueLength":0,"text":""}

## 2026-07-16 20:20:04.137Z change
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":"password","id":"confirm","placeholder":null,"label":"Confirm password","value":"[redacted:length=11]","valueLength":11,"text":""}

## 2026-07-16 20:20:04.137Z blur
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":"password","id":"confirm","placeholder":null,"label":"Confirm password","value":"[redacted:length=11]","valueLength":11,"text":""}

## 2026-07-16 20:20:04.235Z click
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":"checkbox","id":null,"placeholder":null,"label":"I agree to the Terms of Service and Privacy Policy.","value":"on","valueLength":2,"text":""}

## 2026-07-16 20:20:04.236Z change
- element: {"tag":"input","role":null,"ariaLabel":null,"name":null,"type":"checkbox","id":null,"placeholder":null,"label":"I agree to the Terms of Service and Privacy Policy.","value":"on","valueLength":2,"text":""}

## 2026-07-16 20:20:04.821Z click
- element: {"tag":"button","role":null,"ariaLabel":null,"name":null,"type":"submit","id":null,"placeholder":null,"label":null,"value":null,"valueLength":0,"text":"Create account"}

## 2026-07-16 20:20:04.827Z submit
- action: http://localhost:3000/signup
- fields: [{"label":"Email","type":"email","value":"test@test.com","length":13,"redacted":false},{"label":"Username","type":"text","value":"testusername","length":12,"redacted":false},{"label":"Password","type":"password","value":"[redacted:length=11]","length":11,"redacted":true},{"label":"Confirm password","type":"password","value":"[redacted:length=11]","length":11,"redacted":true},{"label":"I agree to the Terms of Service and Privacy Policy.","type":"checkbox","value":"on","length":2,"redacted":false},{"label":"[submit]","type":"submit","value":"","length":0,"redacted":false}]

## 2026-07-16 20:20:05.208Z network.error
- method: GET
- url: http://localhost:8090/api/collections/user_roles/records?page=1&perPage=1000&skipTotal=1&filter=user_id%20%3D%20%27q7c31ibn9qia9w1%27&expand=role_id
- message: Fetch is aborted
- durationMs: 9

## 2026-07-16 20:20:05.221Z navigate
- url: http://localhost:3000/app
- via: replaceState

