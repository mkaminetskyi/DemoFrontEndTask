package com.demo.demotaskforfeside.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Static resources for fragments
        registry.addResourceHandler("/fragments/**")
                .addResourceLocations("classpath:/templates/fragments/");

        // Static resources for pages
        registry.addResourceHandler("/pages/**")
                .addResourceLocations("classpath:/templates/pages/");
    }
}
