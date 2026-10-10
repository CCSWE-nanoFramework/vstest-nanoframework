using nanoFramework.TestFramework;

namespace NFUnitTest2
{
    // No nano.runsettings: exercises the TestFramework package template fallback.
    [TestClass]
    public class Test2
    {
        [TestMethod]
        public void Test_should_pass()
        {
            Assert.AreEqual(2, 1 + 1);
        }
    }
}
