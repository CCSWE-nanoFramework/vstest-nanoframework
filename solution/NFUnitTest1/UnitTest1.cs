using nanoFramework.TestFramework;
using System;
using NFClassLibrary1;

namespace NFUnitTest1
{
    [TestClass]
    public class Test1
    {
        [TestMethod]
        public void Test_should_pass()
        {
            Assert.IsTrue(TestClass.DoesTestPass(true));
        }

        [TestMethod]
        public void Test_should_fail()
        {
            Assert.SkipTest();
            Assert.IsFalse(TestClass.DoesTestPass(true));
        }
    }
}
