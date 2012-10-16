from selenium import webdriver
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.support.ui import WebDriverWait 
import time

driver = webdriver.Firefox()

driver.get("http://localhost:8888/")

#######################################################
# Register a user with username test.
#######################################################
registerElement = driver.find_element_by_name("register")
firstName = driver.find_element_by_id("first_name")
lastName = driver.find_element_by_id("last_name")
username = driver.find_element_by_id("register_username")
password = driver.find_element_by_id("register_password")
passwordRepeat = driver.find_element_by_id("password_repeat")
email = driver.find_element_by_id("email")

firstName.send_keys("test")
lastName.send_keys("testsson")
username.send_keys("test")
password.send_keys("asd")
passwordRepeat.send_keys("asd")
email.send_keys("test@example.com")

registerElement.submit()
time.sleep(0.1)
#######################################################

driver.get("http://localhost:8888/")

registerElement = driver.find_element_by_name("register")
firstName = driver.find_element_by_id("first_name")
lastName = driver.find_element_by_id("last_name")
username = driver.find_element_by_id("register_username")
password = driver.find_element_by_id("register_password")
passwordRepeat = driver.find_element_by_id("password_repeat")
email = driver.find_element_by_id("email")

firstName.send_keys("test")
lastName.send_keys("testsson")
username.send_keys("test")
password.send_keys("asd")
passwordRepeat.send_keys("asda")
email.send_keys("test@example.com")

#Checks for the minus sign when the username is taken
icon_elem = driver.find_element_by_id("username_icon")
assert "icon-minus-sign" in icon_elem.get_attribute("class")

username.clear()
username.send_keys("testsomfungerar")
time.sleep(1)

#If the username is free the ok sign will be displayed
icon_elem = driver.find_element_by_id("username_icon")
assert "icon-ok-sign" in icon_elem.get_attribute("class")

passwordRepeat.clear()
passwordRepeat.send_keys("asd")
registerElement.submit()
time.sleep(0.1)

# Creates a second user for further testing
driver.get("http://localhost:8888/")

registerElement = driver.find_element_by_name("register")
firstName = driver.find_element_by_id("first_name")
lastName = driver.find_element_by_id("last_name")
username = driver.find_element_by_id("register_username")
password = driver.find_element_by_id("register_password")
passwordRepeat = driver.find_element_by_id("password_repeat")
email = driver.find_element_by_id("email")

firstName.send_keys("testarn")
lastName.send_keys("testsson")
username.send_keys("testarn")
password.send_keys("asd")
passwordRepeat.send_keys("asd")
email.send_keys("testarn@example.com")
registerElement.submit()

print "All test passed!"

driver.quit()
