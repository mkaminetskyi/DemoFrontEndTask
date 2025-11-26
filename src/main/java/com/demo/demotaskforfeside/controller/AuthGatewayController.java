package com.demo.demotaskforfeside.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class AuthGatewayController {

    @GetMapping("/")
    public String authGateway(Model model) {
        model.addAttribute("telegramBotUsername", "SpringTaskBot");
        model.addAttribute("authenticated", false);
        return "pages/auth-gateway/auth-gateway";
    }
}
