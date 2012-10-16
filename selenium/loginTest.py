from selenium import webdriver
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.support.ui import WebDriverWait 
import time

driver = webdriver.Firefox()

driver.get("http://localhost:8888/")

inputElement = driver.find_element_by_name("login")
loginUsername = driver.find_element_by_id("username")
loginPassword = driver.find_element_by_id("password")

loginUsername.send_keys("test")
loginPassword.send_keys("fel")
inputElement.submit()
time.sleep(0.5)

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
inputElement.submit()
time.sleep(0.1)

messages_elem = driver.find_element_by_id("wallposts")
messages = messages_elem.find_element_by_class_name("wallpost")
print messages
assert "Test Message" in messages[-1].text

print "All test passed!"

driver.quit()
