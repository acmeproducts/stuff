import hashlib,importlib.util,json,os,subprocess,tempfile,unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('publisher',Path(__file__).with_name('push_verified.py'));p=importlib.util.module_from_spec(spec);spec.loader.exec_module(p)
class Publication(unittest.TestCase):
    def git(self,*args,cwd=None):
        return subprocess.run(['git',*args],cwd=cwd or self.a,check=True,capture_output=True,text=True).stdout.strip()
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name);self.origin=self.root/'origin.git'
        self.git('init','--bare',str(self.origin),cwd=self.root);self.a=self.root/'a';self.b=self.root/'b'
        self.git('clone',str(self.origin),str(self.a),cwd=self.root)
        for folder in (self.a,):
            self.git('config','user.name','test',cwd=folder);self.git('config','user.email','test@example.invalid',cwd=folder)
        self.git('checkout','-b','main');(self.a/'constructor').write_text('verified');(self.a/'generated').write_text('base')
        self.git('add','.');self.git('commit','-m','base');self.git('push','-u','origin','main')
        self.git('clone','-b','main',str(self.origin),str(self.b),cwd=self.root)
        self.git('config','user.name','test',cwd=self.b);self.git('config','user.email','test@example.invalid',cwd=self.b)
        self.before=Path.cwd();os.chdir(self.a)
        self.proof={'input_hashes':{'constructor':hashlib.sha256(b'verified').hexdigest()}}
    def tearDown(self):
        os.chdir(self.before);self.tmp.cleanup()
    def commit(self,folder,name,value):
        (folder/name).write_text(value);self.git('add',name,cwd=folder);self.git('commit','-m',name,cwd=folder)
    def test_concurrent_unrelated_change_and_dirty_generated_file_are_preserved(self):
        self.commit(self.a,'chart','qualified');(self.a/'generated').write_text('local generated pin')
        self.commit(self.b,'unrelated','keep me');self.git('push',cwd=self.b)
        p.publish(self.proof)
        self.git('pull',cwd=self.b)
        self.assertEqual((self.b/'chart').read_text(),'qualified');self.assertEqual((self.b/'unrelated').read_text(),'keep me');self.assertEqual((self.a/'generated').read_text(),'local generated pin')
    def test_changed_constructor_blocks_without_publishing(self):
        self.commit(self.a,'chart','qualified');(self.a/'constructor').write_text('changed')
        with self.assertRaisesRegex(RuntimeError,'changed concurrently'):p.publish(self.proof)
        self.assertFalse((self.b/'chart').exists())
    def test_conflicting_chart_update_is_never_overwritten(self):
        self.commit(self.a,'chart','qualified');self.commit(self.b,'chart','other verified data');self.git('push',cwd=self.b)
        with self.assertRaises(subprocess.CalledProcessError):p.publish(self.proof)
        self.assertEqual((self.b/'chart').read_text(),'other verified data')
if __name__=='__main__':unittest.main()
