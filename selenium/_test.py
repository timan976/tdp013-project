from selenium import webdriver
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.support.ui import WebDriverWait 
import time

driver = webdriver.Firefox()

########################################
driver.get("http://localhost:8888/")

########################################
# Register a user with username test
# for use in later tests
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

########################################
# 
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

print "Registrering!"

########################################
# Login test
driver.get("http://localhost:8888/")

inputElement = driver.find_element_by_name("login")
loginUsername = driver.find_element_by_id("username")
loginPassword = driver.find_element_by_id("password")

loginUsername.send_keys("test")
loginPassword.send_keys("fel")
inputElement.submit()
time.sleep(0.5)

# If wrong password or username is entered an error
# sign is showed
login_error_elem = driver.find_element_by_id("login_error")
assert "display: block" in login_error_elem.get_attribute("style")

loginPassword.clear()
loginPassword.send_keys("asd")
inputElement.submit()
time.sleep(0.1)

########################################
# Search for friend
driver.find_element_by_link_text("Search").click()
time.sleep(0.1)

search_button_elem = driver.find_element_by_css_selector("input[name=send]")
search_elem = driver.find_element_by_css_selector("input[name=query]")
search_elem.send_keys("testarn")
search_button_elem.click()
time.sleep(0.5)

users_elem = driver.find_element_by_id("search_results")
users = users_elem.find_elements_by_css_selector("a")[0]
assert users.text == "testarn testsson (testarn)"
users.click()
time.sleep(0.1)

########################################
# Add friend
driver.find_element_by_id("friend_button").click()
time.sleep(0.1)

########################################
# Post on friends wall
driver.find_element_by_link_text("Friends").click()
time.sleep(0.1)

driver.find_element_by_link_text("testarn testsson (testarn)").click()
time.sleep(0.1)

inputElement = driver.find_element_by_name("post")
inputElement.send_keys("Test Message")
time.sleep(0.1)
inputElement.submit()
time.sleep(0.1)


messages = driver.find_elements_by_class_name("wallpost")
assert "Test Message" in messages[-1].text

print "All test passed!"

driver.quit()
