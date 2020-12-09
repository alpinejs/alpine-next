import Alpine from '../alpine'
import scheduler from '../scheduler'

Alpine.magic('ignore', el => {
    return (callback) => {
        console.log(scheduler)
        scheduler.ignore(() => callback())
    }
})
