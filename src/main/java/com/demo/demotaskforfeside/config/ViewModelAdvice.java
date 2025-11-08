package com.demo.demotaskforfeside.config;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ModelAttribute;

@Component
@ControllerAdvice(annotations = Controller.class)
public class ViewModelAdvice {

    @ModelAttribute
    public void addUserContext(Model model, HttpServletRequest request) {
        boolean authenticated = true;

        model.addAttribute("authenticated", authenticated);
        model.addAttribute("fallbackName", "Гість");
        model.addAttribute("userRole", "ANONYMOUS");
        model.addAttribute("userName", "Гість");
        model.addAttribute("userRoleName", "ANONYMOUS");
    }
}
