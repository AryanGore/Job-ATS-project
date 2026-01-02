import { ApiError } from "./ApiError.js"


export const FSM = ({ currentStageIndex, jobStages, terminalStatus, action}) => {
    if(terminalStatus !== null){
        throw new ApiError(400 , "Invalid Transition: application already in terminal State.")
    }

    switch(action){
        case "NEXT_STAGE": {
            const nextIndex = currentStageIndex + 1;

            if(nextIndex >= jobStages.length){
                throw new ApiError(400, "Invalid Transition: no next Stage Available.");
            }

            return {
                nextStageIndex: nextIndex,
                terminalStatus: null
            };
        }

        case "REJECT": 
            return {
                nextStageIndex: currentStageIndex,
                terminalStatus: "REJECTED"
            }
        
        case "WITHDRAW":
            return {
                nextStageIndex: currentStageIndex,
                terminalStatus: "WITHDRAWN"
            }
        
        case "HIRE": 
            return {
                nextStageIndex: currentStageIndex,
                terminalStatus: "HIRED"
            }
        
        default: 
            throw new ApiError(400, "Invalid FSM Action");

    }
}