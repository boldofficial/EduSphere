if (!self.define) {
  let a,
    e = {};
  const s = (s, n) => (
    (s = new URL(s + '.js', n).href),
    e[s] ||
      new Promise((e) => {
        if ('document' in self) {
          const a = document.createElement('script');
          ((a.src = s), (a.onload = e), document.head.appendChild(a));
        } else ((a = s), importScripts(s), e());
      }).then(() => {
        let a = e[s];
        if (!a) throw new Error(`Module ${s} didn’t register its module`);
        return a;
      })
  );
  self.define = (n, c) => {
    const i = a || ('document' in self ? document.currentScript.src : '') || location.href;
    if (e[i]) return;
    let t = {};
    const d = (a) => s(a, i),
      r = { module: { uri: i }, exports: t, require: d };
    e[i] = Promise.all(n.map((a) => r[a] || d(a))).then((a) => (c(...a), t));
  };
}
define(['./workbox-f1770938'], function (a) {
  'use strict';
  (importScripts(),
    self.skipWaiting(),
    a.clientsClaim(),
    a.precacheAndRoute(
      [
        {
          url: '/_next/static/ShByvVFoW3cFOR9I6YZuu/_buildManifest.js',
          revision: '844db449678d3fb384bf6506fa0a9c41',
        },
        {
          url: '/_next/static/ShByvVFoW3cFOR9I6YZuu/_ssgManifest.js',
          revision: 'b6652df95db52feb4daf4eca35380933',
        },
        { url: '/_next/static/chunks/1013-87e801a2b70bc3bf.js', revision: '87e801a2b70bc3bf' },
        { url: '/_next/static/chunks/1295-dfa7a9e1d5d7c214.js', revision: 'dfa7a9e1d5d7c214' },
        { url: '/_next/static/chunks/1341-36bff493fd629377.js', revision: '36bff493fd629377' },
        { url: '/_next/static/chunks/1528-7331ba979ed8d299.js', revision: '7331ba979ed8d299' },
        { url: '/_next/static/chunks/1895-0cc9b29387a68741.js', revision: '0cc9b29387a68741' },
        { url: '/_next/static/chunks/1966.b8f83f7ba376c962.js', revision: 'b8f83f7ba376c962' },
        { url: '/_next/static/chunks/2162-57311d781a0f5a3a.js', revision: '57311d781a0f5a3a' },
        { url: '/_next/static/chunks/2176-c0aa58417c7cb6d5.js', revision: 'c0aa58417c7cb6d5' },
        { url: '/_next/static/chunks/221-f245cfd1ccb46328.js', revision: 'f245cfd1ccb46328' },
        { url: '/_next/static/chunks/2254-ab90ccf5e54edb66.js', revision: 'ab90ccf5e54edb66' },
        { url: '/_next/static/chunks/2355-b99bd3c209a162af.js', revision: 'b99bd3c209a162af' },
        { url: '/_next/static/chunks/2931.765dfdedc0e0b90d.js', revision: '765dfdedc0e0b90d' },
        { url: '/_next/static/chunks/3123-b26fd3c7d3c7ab1f.js', revision: 'b26fd3c7d3c7ab1f' },
        { url: '/_next/static/chunks/3285-099f226810dab01a.js', revision: '099f226810dab01a' },
        { url: '/_next/static/chunks/3331-d27773bbb1c8608b.js', revision: 'd27773bbb1c8608b' },
        { url: '/_next/static/chunks/3459-f5a3adddcbc03af5.js', revision: 'f5a3adddcbc03af5' },
        { url: '/_next/static/chunks/3563-78f3baf29e20d40b.js', revision: '78f3baf29e20d40b' },
        { url: '/_next/static/chunks/3583-c3df372d2416e862.js', revision: 'c3df372d2416e862' },
        { url: '/_next/static/chunks/3718-7414bf26b8aa7290.js', revision: '7414bf26b8aa7290' },
        { url: '/_next/static/chunks/3793-08ae35db31fddaf6.js', revision: '08ae35db31fddaf6' },
        { url: '/_next/static/chunks/3860-0459451b47667213.js', revision: '0459451b47667213' },
        { url: '/_next/static/chunks/3873-f2164310a2324126.js', revision: 'f2164310a2324126' },
        { url: '/_next/static/chunks/3899.d4d0ae202f418161.js', revision: 'd4d0ae202f418161' },
        { url: '/_next/static/chunks/4215-f048e3777fc3bac2.js', revision: 'f048e3777fc3bac2' },
        { url: '/_next/static/chunks/4334-0796da6dbc8983e8.js', revision: '0796da6dbc8983e8' },
        { url: '/_next/static/chunks/4420-eaf18606793d3164.js', revision: 'eaf18606793d3164' },
        { url: '/_next/static/chunks/4706-c6516bdfe6633cac.js', revision: 'c6516bdfe6633cac' },
        { url: '/_next/static/chunks/4bd1b696-8a4ab4fdf0ae305a.js', revision: '8a4ab4fdf0ae305a' },
        { url: '/_next/static/chunks/518-b6ac468a8465ad7d.js', revision: 'b6ac468a8465ad7d' },
        { url: '/_next/static/chunks/5319-9d60ef75a2098252.js', revision: '9d60ef75a2098252' },
        { url: '/_next/static/chunks/5421-f0788075a67dad45.js', revision: 'f0788075a67dad45' },
        { url: '/_next/static/chunks/54a60aa6-739ff423ce5a9091.js', revision: '739ff423ce5a9091' },
        { url: '/_next/static/chunks/5617-c01e35111ff5cde1.js', revision: 'c01e35111ff5cde1' },
        { url: '/_next/static/chunks/5625-d7f5ff2991b07476.js', revision: 'd7f5ff2991b07476' },
        { url: '/_next/static/chunks/5641-ee0522e06dd743d9.js', revision: 'ee0522e06dd743d9' },
        { url: '/_next/static/chunks/5691-794e97ce33b79b35.js', revision: '794e97ce33b79b35' },
        { url: '/_next/static/chunks/5820-f5f7137b72436d9c.js', revision: 'f5f7137b72436d9c' },
        { url: '/_next/static/chunks/598-4ad45128e4de8e65.js', revision: '4ad45128e4de8e65' },
        { url: '/_next/static/chunks/6086-51177ee78b5a276b.js', revision: '51177ee78b5a276b' },
        { url: '/_next/static/chunks/6384-7810d0ed85483f1b.js', revision: '7810d0ed85483f1b' },
        { url: '/_next/static/chunks/7051-3565483ee100e540.js', revision: '3565483ee100e540' },
        { url: '/_next/static/chunks/70e0d97a-a510bbcae203c191.js', revision: 'a510bbcae203c191' },
        { url: '/_next/static/chunks/7318-ce3fd3b3385c9fb6.js', revision: 'ce3fd3b3385c9fb6' },
        { url: '/_next/static/chunks/7595-c8e38261e9bf8bda.js', revision: 'c8e38261e9bf8bda' },
        { url: '/_next/static/chunks/7671-14fb75ba4fedebd9.js', revision: '14fb75ba4fedebd9' },
        { url: '/_next/static/chunks/7788-782e0d6235d48fce.js', revision: '782e0d6235d48fce' },
        { url: '/_next/static/chunks/7948-f8c99cdef73c58d3.js', revision: 'f8c99cdef73c58d3' },
        { url: '/_next/static/chunks/8022-8a3b1f1030a380b9.js', revision: '8a3b1f1030a380b9' },
        { url: '/_next/static/chunks/8200-d6858ab96e495144.js', revision: 'd6858ab96e495144' },
        { url: '/_next/static/chunks/8281-b4fcf2c858a244c5.js', revision: 'b4fcf2c858a244c5' },
        { url: '/_next/static/chunks/8347-68928cbe9a84d9af.js', revision: '68928cbe9a84d9af' },
        { url: '/_next/static/chunks/8417-4ab1b15d778a113a.js', revision: '4ab1b15d778a113a' },
        { url: '/_next/static/chunks/8500-01a63dafd809e317.js', revision: '01a63dafd809e317' },
        { url: '/_next/static/chunks/8870-a1ebb6b545eae52d.js', revision: 'a1ebb6b545eae52d' },
        { url: '/_next/static/chunks/8928-338cfa8a4cf19f8f.js', revision: '338cfa8a4cf19f8f' },
        { url: '/_next/static/chunks/9139.ed097413dac932f1.js', revision: 'ed097413dac932f1' },
        { url: '/_next/static/chunks/9157-5c0201adae871c0c.js', revision: '5c0201adae871c0c' },
        { url: '/_next/static/chunks/925-62fed9801f3b88f1.js', revision: '62fed9801f3b88f1' },
        { url: '/_next/static/chunks/9368-5245edcdead2da58.js', revision: '5245edcdead2da58' },
        { url: '/_next/static/chunks/9807-3b38e0e599883a26.js', revision: '3b38e0e599883a26' },
        { url: '/_next/static/chunks/9834-0410282f49c855de.js', revision: '0410282f49c855de' },
        {
          url: '/_next/static/chunks/app/(dashboard)/admissions/page-8281e0f29e475e06.js',
          revision: '8281e0f29e475e06',
        },
        {
          url: '/_next/static/chunks/app/(dashboard)/analytics/loading-9d903490a9ad7487.js',
          revision: '9d903490a9ad7487',
        },
        {
          url: '/_next/static/chunks/app/(dashboard)/analytics/page-9e05789cd4553c8b.js',
          revision: '9e05789cd4553c8b',
        },
        {
          url: '/_next/static/chunks/app/(dashboard)/analytics/predictive/page-51c353854665804a.js',
          revision: '51c353854665804a',
        },
        {
          url: '/_next/static/chunks/app/(dashboard)/announcements/page-bc140122dd2e58e9.js',
          revision: 'bc140122dd2e58e9',
        },
        {
          url: '/_next/static/chunks/app/(dashboard)/attendance/page-40b90ee6b9448a43.js',
          revision: '40b90ee6b9448a43',
        },
        {
          url: '/_next/static/chunks/app/(dashboard)/broadsheet/page-caeb11f33dc38ff7.js',
          revision: 'caeb11f33dc38ff7',
        },
        {
          url: '/_next/static/chunks/app/(dashboard)/bursary/error-9be55b20e5ed3536.js',
          revision: '9be55b20e5ed3536',
        },
        {
          url: '/_next/static/chunks/app/(dashboard)/bursary/forecasting/page-ca2e518fa9a980bf.js',
          revision: 'ca2e518fa9a980bf',
        },
        {
          url: '/_next/static/chunks/app/(dashboard)/bursary/loading-9d903490a9ad7487.js',
          revision: '9d903490a9ad7487',
        },
        {
          url: '/_next/static/chunks/app/(dashboard)/bursary/page-59feb4e6c83eede8.js',
          revision: '59feb4e6c83eede8',
        },
        {
          url: '/_next/static/chunks/app/(dashboard)/calendar/page-6a693e98dc46d241.js',
          revision: '6a693e98dc46d241',
        },
        {
          url: '/_next/static/chunks/app/(dashboard)/classes/page-0cd67c211ea39a19.js',
          revision: '0cd67c211ea39a19',
        },
        {
          url: '/_next/static/chunks/app/(dashboard)/cms/page-7251e99233060e74.js',
          revision: '7251e99233060e74',
        },
        {
          url: '/_next/static/chunks/app/(dashboard)/conduct/page-a13f0cc6b8e5f4b3.js',
          revision: 'a13f0cc6b8e5f4b3',
        },
        {
          url: '/_next/static/chunks/app/(dashboard)/dashboard/page-616100d76321adb6.js',
          revision: '616100d76321adb6',
        },
        {
          url: '/_next/static/chunks/app/(dashboard)/data/page-8fe268af1a7b0682.js',
          revision: '8fe268af1a7b0682',
        },
        {
          url: '/_next/static/chunks/app/(dashboard)/error-234abd64fd99b1d2.js',
          revision: '234abd64fd99b1d2',
        },
        {
          url: '/_next/static/chunks/app/(dashboard)/exams/page-22cec036896d89b7.js',
          revision: '22cec036896d89b7',
        },
        {
          url: '/_next/static/chunks/app/(dashboard)/grading/loading-9d903490a9ad7487.js',
          revision: '9d903490a9ad7487',
        },
        {
          url: '/_next/static/chunks/app/(dashboard)/grading/page-9a74d09e5e26dc32.js',
          revision: '9a74d09e5e26dc32',
        },
        {
          url: '/_next/static/chunks/app/(dashboard)/hr/page-9f89346847b2d743.js',
          revision: '9f89346847b2d743',
        },
        {
          url: '/_next/static/chunks/app/(dashboard)/id_cards/page-d539ec594bbbd3d3.js',
          revision: 'd539ec594bbbd3d3',
        },
        {
          url: '/_next/static/chunks/app/(dashboard)/inventory/page-47591d39e411bb97.js',
          revision: '47591d39e411bb97',
        },
        {
          url: '/_next/static/chunks/app/(dashboard)/layout-efcd15862448ca76.js',
          revision: 'efcd15862448ca76',
        },
        {
          url: '/_next/static/chunks/app/(dashboard)/learning/assignments/page-8a32f826555064e3.js',
          revision: '8a32f826555064e3',
        },
        {
          url: '/_next/static/chunks/app/(dashboard)/learning/cbt/%5Bid%5D/page-f29e812f195f2384.js',
          revision: 'f29e812f195f2384',
        },
        {
          url: '/_next/static/chunks/app/(dashboard)/learning/cbt/page-a2960d905f2a7fae.js',
          revision: 'a2960d905f2a7fae',
        },
        {
          url: '/_next/static/chunks/app/(dashboard)/learning/lesson-planner/page-51450843af660f9b.js',
          revision: '51450843af660f9b',
        },
        {
          url: '/_next/static/chunks/app/(dashboard)/learning/lessons/page-3dda77b764124571.js',
          revision: '3dda77b764124571',
        },
        {
          url: '/_next/static/chunks/app/(dashboard)/learning/page-dbea2e6efff4066c.js',
          revision: 'dbea2e6efff4066c',
        },
        {
          url: '/_next/static/chunks/app/(dashboard)/library/page-f6d5894a03b080d1.js',
          revision: 'f6d5894a03b080d1',
        },
        {
          url: '/_next/static/chunks/app/(dashboard)/loading-dff8017305c22f8b.js',
          revision: 'dff8017305c22f8b',
        },
        {
          url: '/_next/static/chunks/app/(dashboard)/messages/page-d6f86010ec5e8cd7.js',
          revision: 'd6f86010ec5e8cd7',
        },
        {
          url: '/_next/static/chunks/app/(dashboard)/newsletter/page-5ed497addb2aa967.js',
          revision: '5ed497addb2aa967',
        },
        {
          url: '/_next/static/chunks/app/(dashboard)/question-bank/page-feafb9be62839fdc.js',
          revision: 'feafb9be62839fdc',
        },
        {
          url: '/_next/static/chunks/app/(dashboard)/settings/page-96134ba288751918.js',
          revision: '96134ba288751918',
        },
        {
          url: '/_next/static/chunks/app/(dashboard)/staff/error-d6da1a6d9c90a3a2.js',
          revision: 'd6da1a6d9c90a3a2',
        },
        {
          url: '/_next/static/chunks/app/(dashboard)/staff/loading-9d903490a9ad7487.js',
          revision: '9d903490a9ad7487',
        },
        {
          url: '/_next/static/chunks/app/(dashboard)/staff/page-48e443a4e9b82f42.js',
          revision: '48e443a4e9b82f42',
        },
        {
          url: '/_next/static/chunks/app/(dashboard)/students/error-9c0dc517019c70b5.js',
          revision: '9c0dc517019c70b5',
        },
        {
          url: '/_next/static/chunks/app/(dashboard)/students/loading-9d903490a9ad7487.js',
          revision: '9d903490a9ad7487',
        },
        {
          url: '/_next/static/chunks/app/(dashboard)/students/page-d1cebd35d6ad77b9.js',
          revision: 'd1cebd35d6ad77b9',
        },
        {
          url: '/_next/static/chunks/app/(dashboard)/support/page-5d814733db4784be.js',
          revision: '5d814733db4784be',
        },
        {
          url: '/_next/static/chunks/app/(dashboard)/teachers/page-8c760dffec51ac30.js',
          revision: '8c760dffec51ac30',
        },
        {
          url: '/_next/static/chunks/app/(dashboard)/timetable/page-63a447a643eab6c0.js',
          revision: '63a447a643eab6c0',
        },
        {
          url: '/_next/static/chunks/app/(dashboard)/transport/page-46dd5db1e602378d.js',
          revision: '46dd5db1e602378d',
        },
        {
          url: '/_next/static/chunks/app/(marketing)/onboarding/page-757b7bad1952616f.js',
          revision: '757b7bad1952616f',
        },
        {
          url: '/_next/static/chunks/app/(marketing)/onboarding/success/page-7941efccf546741b.js',
          revision: '7941efccf546741b',
        },
        {
          url: '/_next/static/chunks/app/_global-error/page-9d903490a9ad7487.js',
          revision: '9d903490a9ad7487',
        },
        {
          url: '/_next/static/chunks/app/_not-found/page-0e6c02f315fee218.js',
          revision: '0e6c02f315fee218',
        },
        {
          url: '/_next/static/chunks/app/admission/layout-9d903490a9ad7487.js',
          revision: '9d903490a9ad7487',
        },
        {
          url: '/_next/static/chunks/app/admission/page-c583a1b844109ef4.js',
          revision: 'c583a1b844109ef4',
        },
        {
          url: '/_next/static/chunks/app/api/aloc/questions/route-9d903490a9ad7487.js',
          revision: '9d903490a9ad7487',
        },
        {
          url: '/_next/static/chunks/app/api/auth/2fa-verify/route-9d903490a9ad7487.js',
          revision: '9d903490a9ad7487',
        },
        {
          url: '/_next/static/chunks/app/api/auth/demo-login/route-9d903490a9ad7487.js',
          revision: '9d903490a9ad7487',
        },
        {
          url: '/_next/static/chunks/app/api/auth/impersonate/route-9d903490a9ad7487.js',
          revision: '9d903490a9ad7487',
        },
        {
          url: '/_next/static/chunks/app/api/auth/login/route-9d903490a9ad7487.js',
          revision: '9d903490a9ad7487',
        },
        {
          url: '/_next/static/chunks/app/api/auth/logout/route-9d903490a9ad7487.js',
          revision: '9d903490a9ad7487',
        },
        {
          url: '/_next/static/chunks/app/api/auth/refresh/route-9d903490a9ad7487.js',
          revision: '9d903490a9ad7487',
        },
        {
          url: '/_next/static/chunks/app/api/contact/route-9d903490a9ad7487.js',
          revision: '9d903490a9ad7487',
        },
        {
          url: '/_next/static/chunks/app/api/media/%5B...path%5D/route-9d903490a9ad7487.js',
          revision: '9d903490a9ad7487',
        },
        {
          url: '/_next/static/chunks/app/api/proxy/%5B...path%5D/route-9d903490a9ad7487.js',
          revision: '9d903490a9ad7487',
        },
        {
          url: '/_next/static/chunks/app/api/schools/verify-slug/%5Bslug%5D/route-9d903490a9ad7487.js',
          revision: '9d903490a9ad7487',
        },
        {
          url: '/_next/static/chunks/app/api/upload/route-9d903490a9ad7487.js',
          revision: '9d903490a9ad7487',
        },
        {
          url: '/_next/static/chunks/app/auth/error/page-5fc77c2e346fd481.js',
          revision: '5fc77c2e346fd481',
        },
        {
          url: '/_next/static/chunks/app/blog/%5Bslug%5D/page-6e31d4ba09e515d2.js',
          revision: '6e31d4ba09e515d2',
        },
        {
          url: '/_next/static/chunks/app/blog/page-074f5cc01e8745b7.js',
          revision: '074f5cc01e8745b7',
        },
        {
          url: '/_next/static/chunks/app/careers/page-d3416ed9aa040502.js',
          revision: 'd3416ed9aa040502',
        },
        {
          url: '/_next/static/chunks/app/dashboard/super-admin/blog/%5Bid%5D/page-3757e62df13b1ee6.js',
          revision: '3757e62df13b1ee6',
        },
        {
          url: '/_next/static/chunks/app/dashboard/super-admin/blog/new/page-bd3180d3793a59c0.js',
          revision: 'bd3180d3793a59c0',
        },
        {
          url: '/_next/static/chunks/app/dashboard/super-admin/blog/page-8b1bbee1661a4fe9.js',
          revision: '8b1bbee1661a4fe9',
        },
        {
          url: '/_next/static/chunks/app/dashboard/super-admin/blog/settings/page-88caa722bb54d6fd.js',
          revision: '88caa722bb54d6fd',
        },
        {
          url: '/_next/static/chunks/app/dashboard/super-admin/broadcasts/page-b1fc30c0ef38b43b.js',
          revision: 'b1fc30c0ef38b43b',
        },
        {
          url: '/_next/static/chunks/app/dashboard/super-admin/demo-requests/page-2acb8d7502a041a3.js',
          revision: '2acb8d7502a041a3',
        },
        {
          url: '/_next/static/chunks/app/dashboard/super-admin/email-marketing/page-8c19ecb9c2dd4bfe.js',
          revision: '8c19ecb9c2dd4bfe',
        },
        {
          url: '/_next/static/chunks/app/dashboard/super-admin/feedback/page-75606d26820e6412.js',
          revision: '75606d26820e6412',
        },
        {
          url: '/_next/static/chunks/app/dashboard/super-admin/financials/page-f91c66cf7d36fa0c.js',
          revision: 'f91c66cf7d36fa0c',
        },
        {
          url: '/_next/static/chunks/app/dashboard/super-admin/governance/page-e4702644cc9321ef.js',
          revision: 'e4702644cc9321ef',
        },
        {
          url: '/_next/static/chunks/app/dashboard/super-admin/layout-3c8366991068bc71.js',
          revision: '3c8366991068bc71',
        },
        {
          url: '/_next/static/chunks/app/dashboard/super-admin/logs/page-45dbf1a82361b1fe.js',
          revision: '45dbf1a82361b1fe',
        },
        {
          url: '/_next/static/chunks/app/dashboard/super-admin/modules/page-866d02d339844eb5.js',
          revision: '866d02d339844eb5',
        },
        {
          url: '/_next/static/chunks/app/dashboard/super-admin/page-7b83b4a35c5a8ac6.js',
          revision: '7b83b4a35c5a8ac6',
        },
        {
          url: '/_next/static/chunks/app/dashboard/super-admin/plans/page-63bfbdc2a275ee16.js',
          revision: '63bfbdc2a275ee16',
        },
        {
          url: '/_next/static/chunks/app/dashboard/super-admin/settings/page-0200dda912da3ac5.js',
          revision: '0200dda912da3ac5',
        },
        {
          url: '/_next/static/chunks/app/dashboard/super-admin/support/page-46df4a12036824fe.js',
          revision: '46df4a12036824fe',
        },
        {
          url: '/_next/static/chunks/app/dashboard/super-admin/templates/page-a6028cd1a5ac3dcd.js',
          revision: 'a6028cd1a5ac3dcd',
        },
        {
          url: '/_next/static/chunks/app/dashboard/super-admin/tenants/page-f8952d7919d9f5b3.js',
          revision: 'f8952d7919d9f5b3',
        },
        {
          url: '/_next/static/chunks/app/developers/page-c180ff058e1b301c.js',
          revision: 'c180ff058e1b301c',
        },
        { url: '/_next/static/chunks/app/error-27e4f932a139e4ad.js', revision: '27e4f932a139e4ad' },
        {
          url: '/_next/static/chunks/app/help/page-4fb31dee7fd77cdd.js',
          revision: '4fb31dee7fd77cdd',
        },
        {
          url: '/_next/static/chunks/app/layout-6e54a19bc089f20a.js',
          revision: '6e54a19bc089f20a',
        },
        {
          url: '/_next/static/chunks/app/loading-9d903490a9ad7487.js',
          revision: '9d903490a9ad7487',
        },
        {
          url: '/_next/static/chunks/app/login/page-299521083961ba09.js',
          revision: '299521083961ba09',
        },
        {
          url: '/_next/static/chunks/app/manifest.webmanifest/route-9d903490a9ad7487.js',
          revision: '9d903490a9ad7487',
        },
        {
          url: '/_next/static/chunks/app/opengraph-image/route-9d903490a9ad7487.js',
          revision: '9d903490a9ad7487',
        },
        { url: '/_next/static/chunks/app/page-70cee404400a688d.js', revision: '70cee404400a688d' },
        {
          url: '/_next/static/chunks/app/pay/%5Bhash%5D/page-335fa902e03e2845.js',
          revision: '335fa902e03e2845',
        },
        {
          url: '/_next/static/chunks/app/privacy-policy/layout-9d903490a9ad7487.js',
          revision: '9d903490a9ad7487',
        },
        {
          url: '/_next/static/chunks/app/privacy-policy/page-53251fd7cbbe9bc2.js',
          revision: '53251fd7cbbe9bc2',
        },
        {
          url: '/_next/static/chunks/app/resources/page-ceb7ecd8339968f6.js',
          revision: 'ceb7ecd8339968f6',
        },
        {
          url: '/_next/static/chunks/app/robots.txt/route-9d903490a9ad7487.js',
          revision: '9d903490a9ad7487',
        },
        {
          url: '/_next/static/chunks/app/sitemap.xml/route-9d903490a9ad7487.js',
          revision: '9d903490a9ad7487',
        },
        {
          url: '/_next/static/chunks/app/success-stories/page-d9fd785b8f1d5e52.js',
          revision: 'd9fd785b8f1d5e52',
        },
        {
          url: '/_next/static/chunks/app/terms-of-service/layout-9d903490a9ad7487.js',
          revision: '9d903490a9ad7487',
        },
        {
          url: '/_next/static/chunks/app/terms-of-service/page-826bbe78854bb762.js',
          revision: '826bbe78854bb762',
        },
        {
          url: '/_next/static/chunks/app/twitter-image/route-9d903490a9ad7487.js',
          revision: '9d903490a9ad7487',
        },
        {
          url: '/_next/static/chunks/app/verify/%5Bhash%5D/page-bd1ed21b2e5efb08.js',
          revision: 'bd1ed21b2e5efb08',
        },
        { url: '/_next/static/chunks/framework-16eb040a850c1f4a.js', revision: '16eb040a850c1f4a' },
        { url: '/_next/static/chunks/main-135440ef430ecc3a.js', revision: '135440ef430ecc3a' },
        { url: '/_next/static/chunks/main-app-750a7d8b326ac5b3.js', revision: '750a7d8b326ac5b3' },
        {
          url: '/_next/static/chunks/next/dist/client/components/builtin/app-error-9d903490a9ad7487.js',
          revision: '9d903490a9ad7487',
        },
        {
          url: '/_next/static/chunks/next/dist/client/components/builtin/forbidden-9d903490a9ad7487.js',
          revision: '9d903490a9ad7487',
        },
        {
          url: '/_next/static/chunks/next/dist/client/components/builtin/global-error-5a6bfcb0f4d2c5fa.js',
          revision: '5a6bfcb0f4d2c5fa',
        },
        {
          url: '/_next/static/chunks/next/dist/client/components/builtin/not-found-9d903490a9ad7487.js',
          revision: '9d903490a9ad7487',
        },
        {
          url: '/_next/static/chunks/next/dist/client/components/builtin/unauthorized-9d903490a9ad7487.js',
          revision: '9d903490a9ad7487',
        },
        {
          url: '/_next/static/chunks/polyfills-42372ed130431b0a.js',
          revision: '846118c33b2c0e922d7b3a7676f81f6f',
        },
        { url: '/_next/static/chunks/webpack-c0407428a4d9927f.js', revision: 'c0407428a4d9927f' },
        { url: '/_next/static/css/57422d1d0b46045a.css', revision: '57422d1d0b46045a' },
        { url: '/_next/static/css/a6fc798b75e96a95.css', revision: 'a6fc798b75e96a95' },
        {
          url: '/_next/static/media/19cfc7226ec3afaa-s.woff2',
          revision: '9dda5cfc9a46f256d0e131bb535e46f8',
        },
        {
          url: '/_next/static/media/21350d82a1f187e9-s.woff2',
          revision: '4e2553027f1d60eff32898367dd4d541',
        },
        {
          url: '/_next/static/media/8e9860b6e62d6359-s.woff2',
          revision: '01ba6c2a184b8cba08b0d57167664d75',
        },
        {
          url: '/_next/static/media/ba9851c3c22cd980-s.woff2',
          revision: '9e494903d6b0ffec1a1e14d34427d44d',
        },
        {
          url: '/_next/static/media/c5fe6dc8356a8c31-s.woff2',
          revision: '027a89e9ab733a145db70f09b8a18b42',
        },
        {
          url: '/_next/static/media/df0a9ae256c0569c-s.woff2',
          revision: 'd54db44de5ccb18886ece2fda72bdfe0',
        },
        {
          url: '/_next/static/media/e4af272ccee01ff0-s.p.woff2',
          revision: '65850a373e258f1c897a2b3d75eb74de',
        },
        { url: '/favicon.png', revision: '1cc897bdee6702865387eb11ccb6ca52' },
        { url: '/footer-logo.png', revision: '7714ccced904fb0ea083c545b39ef0fa' },
        { url: '/fruifulvine_class.jpg', revision: '0e1bb4cf094a3d4ac388e8a552cbcbb5' },
        { url: '/fruitful1.jpg.jpg', revision: 'd256527b53db72e6587af3cbb744f4ff' },
        { url: '/fruitful2.jpg.jpg', revision: 'fb36d7ff4c3de5358adaa1e5225a4f39' },
        { url: '/fruitful3.jpg.jpg', revision: '9fa7b28963f67167ca5d46a45768a4fc' },
        { url: '/fruitful4.jpg.jpg', revision: '184d81b05e4f3dbfcaea3d8a915f6f2d' },
        { url: '/fruitful5.jpg.jpg', revision: '0e1bb4cf094a3d4ac388e8a552cbcbb5' },
        { url: '/fruitful_logo_main.png', revision: '2bf77e7dbc7eadcdc191b0092ff06c10' },
        { url: '/fruitfulnew.jpg', revision: 'f2d9b141f433f958260c375dd878396a' },
        { url: '/full-logo.png', revision: '36e52413436ec063a7a756becc4e80fb' },
        { url: '/hero-bg.png', revision: '3dc2bc5f94d6cff6accc8d0593f5573f' },
        { url: '/hero-classroom.jpg', revision: '39ef11ec5c0622435b42b94f780980f4' },
        { url: '/hero1.jpg', revision: 'fcd7db6edc287f0867aa7ff499a140b6' },
        { url: '/login-bg-african.png', revision: 'c5277f68514f1900a713ad75ba151923' },
        { url: '/login-bg-classroom.png', revision: 'b2f91f141601e67d90d067246f14a67c' },
        { url: '/login-bg-new.png', revision: '7ae52cc04db10046abb78af65651b9ab' },
        { url: '/logo.png', revision: '1cc897bdee6702865387eb11ccb6ca52' },
        { url: '/noise.svg', revision: 'bb6882133809417d0c3ad96ea343f455' },
        { url: '/slider 3.jpg', revision: '2afa20de71587c8694c751b48be390ca' },
      ],
      { ignoreURLParametersMatching: [/^utm_/, /^fbclid$/] }
    ),
    a.cleanupOutdatedCaches(),
    a.registerRoute(
      '/',
      new a.NetworkFirst({
        cacheName: 'start-url',
        plugins: [
          {
            cacheWillUpdate: async ({ response: a }) =>
              a && 'opaqueredirect' === a.type
                ? new Response(a.body, { status: 200, statusText: 'OK', headers: a.headers })
                : a,
          },
        ],
      }),
      'GET'
    ),
    a.registerRoute(
      /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
      new a.CacheFirst({
        cacheName: 'google-fonts-webfonts',
        plugins: [new a.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 31536e3 })],
      }),
      'GET'
    ),
    a.registerRoute(
      /^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,
      new a.StaleWhileRevalidate({
        cacheName: 'google-fonts-stylesheets',
        plugins: [new a.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 604800 })],
      }),
      'GET'
    ),
    a.registerRoute(
      /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
      new a.StaleWhileRevalidate({
        cacheName: 'static-font-assets',
        plugins: [new a.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 604800 })],
      }),
      'GET'
    ),
    a.registerRoute(
      /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      new a.StaleWhileRevalidate({
        cacheName: 'static-image-assets',
        plugins: [new a.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 2592e3 })],
      }),
      'GET'
    ),
    a.registerRoute(
      /\/_next\/static.+\.js$/i,
      new a.CacheFirst({
        cacheName: 'next-static-js-assets',
        plugins: [new a.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 86400 })],
      }),
      'GET'
    ),
    a.registerRoute(
      /\/_next\/image\?url=.+$/i,
      new a.StaleWhileRevalidate({
        cacheName: 'next-image',
        plugins: [new a.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 86400 })],
      }),
      'GET'
    ),
    a.registerRoute(
      /\.(?:mp3|wav|ogg)$/i,
      new a.CacheFirst({
        cacheName: 'static-audio-assets',
        plugins: [
          new a.RangeRequestsPlugin(),
          new a.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      'GET'
    ),
    a.registerRoute(
      /\.(?:mp4|webm)$/i,
      new a.CacheFirst({
        cacheName: 'static-video-assets',
        plugins: [
          new a.RangeRequestsPlugin(),
          new a.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      'GET'
    ),
    a.registerRoute(
      /\.(?:js)$/i,
      new a.StaleWhileRevalidate({
        cacheName: 'static-js-assets',
        plugins: [new a.ExpirationPlugin({ maxEntries: 48, maxAgeSeconds: 86400 })],
      }),
      'GET'
    ),
    a.registerRoute(
      /\.(?:css|less)$/i,
      new a.StaleWhileRevalidate({
        cacheName: 'static-style-assets',
        plugins: [new a.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 })],
      }),
      'GET'
    ),
    a.registerRoute(
      /\/_next\/data\/.+\/.+\.json$/i,
      new a.StaleWhileRevalidate({
        cacheName: 'next-data',
        plugins: [new a.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 })],
      }),
      'GET'
    ),
    a.registerRoute(
      /\.(?:json|xml|csv)$/i,
      new a.NetworkFirst({
        cacheName: 'static-data-assets',
        plugins: [new a.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 })],
      }),
      'GET'
    ),
    a.registerRoute(
      ({ sameOrigin: a, url: { pathname: e } }) =>
        !(!a || e.startsWith('/api/auth/callback') || !e.startsWith('/api/')),
      new a.NetworkFirst({
        cacheName: 'apis',
        networkTimeoutSeconds: 10,
        plugins: [new a.ExpirationPlugin({ maxEntries: 16, maxAgeSeconds: 86400 })],
      }),
      'GET'
    ),
    a.registerRoute(
      ({ request: a, url: { pathname: e }, sameOrigin: s }) =>
        '1' === a.headers.get('RSC') &&
        '1' === a.headers.get('Next-Router-Prefetch') &&
        s &&
        !e.startsWith('/api/'),
      new a.NetworkFirst({
        cacheName: 'pages-rsc-prefetch',
        plugins: [new a.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 })],
      }),
      'GET'
    ),
    a.registerRoute(
      ({ request: a, url: { pathname: e }, sameOrigin: s }) =>
        '1' === a.headers.get('RSC') && s && !e.startsWith('/api/'),
      new a.NetworkFirst({
        cacheName: 'pages-rsc',
        plugins: [new a.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 })],
      }),
      'GET'
    ),
    a.registerRoute(
      ({ url: { pathname: a }, sameOrigin: e }) => e && !a.startsWith('/api/'),
      new a.NetworkFirst({
        cacheName: 'pages',
        plugins: [new a.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 })],
      }),
      'GET'
    ),
    a.registerRoute(
      ({ sameOrigin: a }) => !a,
      new a.NetworkFirst({
        cacheName: 'cross-origin',
        networkTimeoutSeconds: 10,
        plugins: [new a.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 3600 })],
      }),
      'GET'
    ));
});
