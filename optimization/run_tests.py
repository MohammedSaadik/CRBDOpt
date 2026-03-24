import test_auth
import sys

with open('log.txt', 'w', encoding='utf-8') as f:
    orig_stdout = sys.stdout
    sys.stdout = f
    
    test_auth.test_offset(0)
    test_auth.test_offset(365)
    test_auth.test_offset(365*2)
    test_auth.test_offset(365*2 + 30)
    test_auth.test_offset(700)
    test_auth.test_offset(730)
    
    sys.stdout = orig_stdout
