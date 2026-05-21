package com.taller.sae.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class SpaController {

    @RequestMapping(value = { "/", "/{path:[^\\.]*}", "/{path:[^\\.]*}/**" })
    public String spa() {
        return "forward:/index.html";
    }
}
