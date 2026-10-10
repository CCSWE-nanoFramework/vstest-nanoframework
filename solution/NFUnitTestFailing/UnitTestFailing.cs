using nanoFramework.TestFramework;

namespace NFUnitTestFailing
{
    // Fails on purpose: CI asserts the action reports the failure.
    [TestClass]
    public class TestFailing
    {
        [TestMethod]
        public void Test_should_fail()
        {
            Assert.AreEqual(3, 1 + 1);
        }
    }
}
