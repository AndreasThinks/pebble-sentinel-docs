"""Real-browser acceptance. Run with the checkout venv and a local static server."""
import os, shutil, unittest
from pathlib import Path
from playwright.sync_api import sync_playwright
URL=os.environ.get('SITE_URL','http://127.0.0.1:8875/')
OUT=Path(os.environ.get('PROOF_DIR','proof-artifacts'))
class SiteTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.p=sync_playwright().start()
  cls.browser=cls.p.chromium.launch(executable_path=os.environ.get('CHROME_PATH') or shutil.which('google-chrome'),headless=True,args=['--no-sandbox'])
  OUT.mkdir(parents=True,exist_ok=True)
 @classmethod
 def tearDownClass(cls): cls.browser.close();cls.p.stop()
 def setUp(self):
  self.page=self.browser.new_page(viewport={'width':1440,'height':1000},reduced_motion='reduce')
  self.errors=[];self.page.on('pageerror',lambda e:self.errors.append(str(e)))
  self.page.goto(URL,wait_until='networkidle')
 def tearDown(self):self.page.close()
 def state(self):return self.page.locator('#result-state').inner_text()
 def test_scenario_controls_change_the_actual_result(self):
  self.page.locator('[data-scenario=steady]').click();self.assertEqual(self.state(),'NORMAL')
  self.page.locator('[data-scenario=change]').click();self.assertEqual(self.state(),'STRAIN')
 def test_missing_and_inadequate_nights_break_confirmation(self):
  self.page.locator('#missing-toggle').check();self.assertEqual(self.state(),'WATCH')
  self.page.locator('#missing-toggle').uncheck();self.page.locator('#motion-toggle').check();self.assertEqual(self.state(),'WATCH')
 def test_scrubber_explains_calibration_then_watch_then_recovery(self):
  for day,expected in [(14,'CALIBRATING'),(15,'NORMAL'),(19,'WATCH'),(20,'STRAIN'),(21,'RECOVERING'),(22,'NORMAL')]:
   self.page.locator('#night-slider').fill(str(day));self.assertEqual(self.state(),expected)
 def test_desktop_layout_assets_console_and_disclosure(self):
  self.assertEqual(self.errors,[])
  self.assertTrue(self.page.evaluate('document.documentElement.scrollWidth <= innerWidth'))
  self.assertTrue(self.page.locator('img').evaluate_all('(els)=>els.every(i=>i.complete&&i.naturalWidth>0)'))
  self.assertGreater(self.page.locator('#chart-content circle').count(),10)
  self.assertTrue(self.page.locator('.watch-case img').evaluate('img=>{const r=img.getBoundingClientRect(); return document.elementFromPoint(r.x+r.width/2,r.y+r.height*0.8)?.closest(".watch-case") !== null}'), 'The watch strap must not cover the app screen')
  self.page.locator('summary').first.click();self.assertTrue(self.page.get_by_text('The app requests heart rate',exact=False).is_visible())
  self.page.screenshot(path=str(OUT/'desktop-full.png'),full_page=True)
  self.page.locator('#explorer').screenshot(path=str(OUT/'interactive.png'))
 def test_mobile_and_keyboard_access_without_overflow(self):
  self.page.set_viewport_size({'width':390,'height':844});self.page.reload(wait_until='networkidle')
  self.assertTrue(self.page.evaluate('document.documentElement.scrollWidth <= innerWidth'))
  self.page.locator('#night-slider').focus();self.page.keyboard.press('Home');self.assertEqual(self.state(),'CALIBRATING')
  self.page.locator('[data-scenario=steady]').click();self.assertEqual(self.state(),'NORMAL')
  self.page.screenshot(path=str(OUT/'mobile-full.png'),full_page=True)
 def test_narrow_mobile_has_no_decorative_overflow(self):
  for width in [320,360]:
   self.page.set_viewport_size({'width':width,'height':900})
   self.page.reload(wait_until='networkidle')
   self.assertTrue(self.page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'Overflow at {width}px')
 def test_core_information_survives_without_javascript(self):
  context=self.browser.new_context(java_script_enabled=False,viewport={'width':390,'height':844})
  page=context.new_page();page.goto(URL,wait_until='networkidle')
  # Chromium execution-disable emulation does not consistently reparse noscript.
  # Verify the useful static content and native disclosure controls themselves.
  self.assertTrue(page.locator('#hero-title').is_visible())
  page.locator('summary').first.click()
  self.assertTrue(page.get_by_text('The app requests heart rate',exact=False).is_visible())
  self.assertTrue(page.locator('#rules').is_visible());context.close()
if __name__=='__main__':unittest.main(verbosity=2)
